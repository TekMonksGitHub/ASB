/* 
 * main.js, Main ESB process
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

global.ASBCONSTANTS = require(__dirname + "/constants.js");
const fs = require("fs");
const conf = require(ASBCONSTANTS.ESBCONF);
const utils = require(`${ASBCONSTANTS.LIBDIR}/utils.js`);

global.ESB = global.ESB || {"env":{}, "launchNewFlowInstance": launchNewFlowInstance, conf};       // The global ESB namespace

// support starting in stand-alone config
if (require("cluster").isMaster) bootstrap();

function bootstrap(noflows) {
    console.log("Starting the ESB...");

    /* Init environment */
    console.log("Initializing the environment.");
    for (const [key, value] of Object.entries(conf.env||{})) process.env[key] = value;

    /* Init the logs */
	console.log("Initializing the logs.");
    require(ASBCONSTANTS.LIBDIR+"/log.js").initGlobalLoggerSync(ASBCONSTANTS.LOGMAIN);

    /* Setup message factory */
    global.MESSAGE_FACTORY = require(ASBCONSTANTS.LIBDIR+"/messageFactory.js");

    /* Run the flows */
    try {
        const flowsToRun = [];
        if (!noflows) for (const filename of fs.readdirSync(ASBCONSTANTS.FLOWSDIR)) try {  // no flows means flows will be added manually later
            const flowRaw = JSON.parse(fs.readFileSync(`${ASBCONSTANTS.FLOWSDIR}/${filename}`, "UTF-8"));
            const flowFormatted = initFlow(flowRaw);
            flowsToRun.push(flowFormatted);
        } catch (err) {throw (`Bad flow ${filename}: ${err}`);}

        for (const flowToRun of flowsToRun) launchNewFlowInstance(flowToRun);

        ASBLOG.info("Running...", true);
        console.log("Running...");
        if (!noflows) ASBLOG.overrideConsole();              // everything goes to the log files now if we aren't in in-process mode
    } catch (err) {
        let errMsg = `FATAL: Can't read the flows, exiting: ${err}`;
        console.log(errMsg)
        ASBLOG.error(errMsg, true); 
        process.exit(1);
    }
}

function initFlow(flowThis) {
    flowThis.env = {};
    if ((!flowThis.hasOwnProperty('autoGC')) || flowThis.autoGC) flowThis.garbagecollector = {    // add in Garbage collector
        "type":"simple",
        "dependencies":[[]],
        "isMessageConsumer":true
    }
    return flowThis;
}

function launchNewFlowInstance(flow) {
    if (flow.flow.disabled) return;   // skip disabled flows

    const routeNames = Object.keys(flow);
    routeNames.splice(routeNames.indexOf("flow"), 1);
    routeNames.splice(routeNames.indexOf("env"), 1);
    ASBLOG.info(`[ESB] Starting the flow: ${flow.flow.name}`);

    routeNames.forEach(route => flow[route].flow = flow);
    runFlow(flow, routeNames);
}

function runFlow(flow, routeNames) {
    const messageContainer = {
        messages:[], 
        add(message) {this.messages.push(message)}, 
        remove(message) {this.messages.splice(this.messages.findIndex(m => m === message),1)}
    };

    const flowRun = _ => {
        if ((!flow.fatalError) || flow.flow.ignorefatalerrors) {
            routeNames.forEach(routeName => {
                if (flow[routeName].isMessageGenerator) runFlowRoute(flow, routeName, flow[routeName], messageContainer);
                else {
                    let dependencies = flow[routeName].dependencies;
                    if (!dependencies) dependencies = [[]];
                    if (!Array.isArray(dependencies)) dependencies = [[dependencies]];
                    if (!Array.isArray(dependencies[0])) dependencies = [dependencies];

                    const messages = getMessagesForRoute(flow, messageContainer, routeName, dependencies);
                    for (const message of messages) runFlowRoute(flow, routeName, flow[routeName], messageContainer, message);
                }
            });
        } else {ASBLOG.debug(`[ESB] Can't run flow ${flow.flow.name} due to fatal error, skipping.`);}
    }

    const setIntervalImmediately = (functionToCall, interval) => {functionToCall(); setInterval(functionToCall, interval)};
    setIntervalImmediately(flowRun, flow.flow.cpuInterval||conf.cpuInterval); // run at given frequency and first one immediately
}

function getMessagesForRoute(flow, messageContainer, routeName, dependencies) {
    let messages = [];
    for (const message of messageContainer.messages) {
        if ((!_isBooleanDependencyExpression(dependencies)) && (!message.routesDone.includes(routeName)) && 
                (!message.routesDone.includes(`${routeName}.error`)) &&
                dependencies.some(dependenciesThis => dependenciesAreSubset(dependenciesThis, message.routesDone)))
            messages.push(message);
        else if (_isBooleanDependencyExpression(dependencies) && _checkBooleanDependencyExpressionIsSatisfied(dependencies, message.routesDone, flow) 
                && (!message.routesDone.includes(routeName)) && (!message.routesDone.includes(`${routeName}.error`))) 
            messages.push(message);
    }
    return messages;
}

function dependenciesAreSubset(dependencies, superset) {
    return dependencies.every(e => {
        if (e.startsWith("!")) return (superset.indexOf(e.substring(1, e.length)) == -1);
        else return (superset.indexOf(e) != -1);
    });
}

function runFlowRoute(flow, route, routeObj, messageContainer, message) {
    // can not run a consumer when message has to stay alive, as it will kill the message
    if (routeObj.isMessageConsumer && (!message.isGCEligible())) return;

    try {
        let dirPath = route.replace(/\..*/g,"").replace(/[0-9|.]/g, "")+"s";
        if (!routeObj.isMessageGenerator) ASBLOG.info(`[ESB] Flow ${flow.flow.name} is routing ${message?`message with timestamp ${message.timestamp} `:""}to route ${route}`);
        require(`${ASBCONSTANTS.ROOTDIR}/${dirPath}/${routeObj.type}.js`).start(route, _expandRouteProps(routeObj, flow, message), messageContainer, message);
        if (routeObj.isMessageConsumer && message.isGCEligible()) messageContainer.remove(message); // consumed!
    } catch (e) {
        ASBLOG.error(`[ESB] FATAL: Bad route in the flow ${flow.flow.name} for route: ${route}, disabling the flow.`);
        ASBLOG.error(`[ESB] FATAL: ${e.message}`);
        ASBLOG.error(`[ESB] FATAL Stack: ${e.stack}`);
        flow.fatalError = true;
        ASBLOG.error(e);
    }
}


function _isBooleanDependencyExpression(expression) {
    let testExpression = expression; while (Array.isArray(testExpression)) testExpression = testExpression[0];
    if ((testExpression.indexOf("&&") != -1) || (testExpression.indexOf("||")  != -1)) return true;
    else return false;
}

function _checkBooleanDependencyExpressionIsSatisfied(expression, routesDone, flow) {
    let testExpression = expression; while (Array.isArray(testExpression)) testExpression = testExpression[0];
    testExpression = testExpression.replaceAll(".", "_");
    let evalCode = ""; for (const routeNode of Object.keys(flow)) {
        if (routeNode == "flow" || routeNode == "garbagecollector") continue;   // these don't matter
        evalCode += `const ${routeNode.replaceAll(".","_")} = ${routesDone.includes(routeNode)?"true":"false"};\n`;
    }
    evalCode += testExpression; return eval(evalCode);
}

function _expandRouteProps(routeObj, flow, message) {
    if (!flow.flow.expandRouteProperties) return;
    const cloneObj = {};
    for (const [key, value] of Object.entries(routeObj)) cloneObj[key] = typeof value == "string" || value instanceof String?
        utils.expandProperty(value, flow, message):value;
    return cloneObj;
}

const addFlow = flowRaw => {const flowToRun = initFlow(flowRaw); launchNewFlowInstance(flowToRun);}

module.exports = {bootstrap, addFlow};
