/* 
 * main.js, Main ESB process
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

global.CONSTANTS = require(__dirname + "/constants.js");
const fs = require("fs");
let conf = require(CONSTANTS.ESBCONF);

global.ESB = {"env":{}, "launchNewFlowInstance": launchNewFlowInstance};       // The global ESB namespace

// support starting in stand-alone config
if (require("cluster").isMaster) bootstrap();

function bootstrap() {
    console.log("Starting the ESB...");

    /* Init the logs */
	console.log("Initializing the logs.");
    require(CONSTANTS.LIBDIR+"/log.js").initGlobalLogger(CONSTANTS.LOGMAIN);

    /* Setup message factory */
    global.MESSAGE_FACTORY = require(CONSTANTS.LIBDIR+"/messageFactory.js");

    /* Run the flows */
    try {
        let flowsToRun = [];
        fs.readdirSync(CONSTANTS.FLOWSDIR).forEach( filename => { 
            try {
                let flowThis = JSON.parse(fs.readFileSync(`${CONSTANTS.FLOWSDIR}/${filename}`, "UTF-8"));
                flowThis.env = {};
                if (!flowThis.hasOwnProperty('autoGC') || flowThis.autoGC) flowThis.garbagecollector = {    // add in Garbage collector
                    "type":"simple",
                    "dependencies":[[]],
                    "isMessageConsumer":true
                }
                flowsToRun.push(flowThis);
            } catch (err) {throw (`Bad flow ${filename}: ${err}`);}
        });
        runFlows(flowsToRun);

        LOG.info("Running...", true);
        console.log("Running...");
        LOG.overrideConsole();              // everything goes to the log files now
    } catch (err) {
        let errMsg = `FATAL: Can't read the flows, exiting: ${err}`;
        console.log(errMsg)
        LOG.error(errMsg, true); 
        process.exit(1);
    }
}

function runFlows(flows) {
    flows.forEach(flow => launchNewFlowInstance(flow));
}

function launchNewFlowInstance(flow) {
    if (flow.flow.disabled) return;   // skip disabled flows

    let routeNames = Object.keys(flow);
    routeNames.splice(routeNames.indexOf("flow"), 1);
    routeNames.splice(routeNames.indexOf("env"), 1);
    LOG.info(`[ESB] Starting flow: ${flow.flow.name}`);

    routeNames.forEach(route => flow[route].flow = flow);
    runFlow(flow, routeNames);
}

function runFlow(flow, routeNames) {
    let messageContainer = {
        messages:[], 
        add(message) {this.messages.push(message)}, 
        remove(message) {this.messages.splice(this.messages.findIndex(m => m === message),1)}
    };

    let flowRun = _ => {
        if (!flow.fatalError) {
            routeNames.forEach(routeName => {
                if (flow[routeName].isMessageGenerator) runFlowRoute(flow, routeName, flow[routeName], messageContainer);
                else {
                    let dependencies = flow[routeName].dependencies;
                    if (!dependencies) dependencies = [[]];
                    if (!Array.isArray(dependencies)) dependencies = [[dependencies]];
                    if (!Array.isArray(dependencies[0])) dependencies = [dependencies];

                    let messages = getMessagesForRoute(messageContainer, routeName, dependencies);
                    messages.forEach(message => runFlowRoute(flow, routeName, flow[routeName], messageContainer, message));
                }
            });
        } else {LOG.debug(`[ESB] Can't run flow ${flow.flow.name} due to fatal error, skipping.`);}
    }

    setInterval(flowRun, flow.flow.cpuInterval ? flow.flow.cpuInterval : conf.cpuInterval); // give back the CPU cycles
}

function getMessagesForRoute(messageContainer, routeName, dependencies) {
    let messages = [];
    messageContainer.messages.forEach(message => {
        if (!message.routesDone.includes(routeName) && !message.routesDone.includes(`${routeName}.error`) &&
                dependencies.some(dependenciesThis => dependenciesAreSubset(dependenciesThis,message.routesDone)))
            messages.push(message);
    });
    return messages;
}

function dependenciesAreSubset(dependencies, superset) {
    return dependencies.every(e => {
        if (e.startsWith("!")) return (superset.indexOf(e.substring(1, e.length)) == -1);
        else return (superset.indexOf(e) != -1);
    });
}

function runFlowRoute(flow, route, routeObj, messageContainer, message) {
    // can not run a consumer when message has to stay alive
    if (routeObj.isMessageConsumer && !message.isGCEligible) return;

    try {
        let dirPath = route.replace(/\..*/g,"").replace(/[0-9|.]/g, "")+"s";
        require(`${CONSTANTS.ROOTDIR}/${dirPath}/${routeObj.type}.js`).start(
            route, routeObj, messageContainer, message);
        if (routeObj.isMessageConsumer && message.isGCEligible) messageContainer.remove(message); // consumed!
    } catch (e) {
        LOG.error(`[ESB] FATAL: Bad route in the flow: ${route}, disabling the flow.`);
        LOG.error(`[ESB] FATAL: ${e}`);
        flow.fatalError = true;
        LOG.error(e);
    }
}

module.exports = {bootstrap: bootstrap};
