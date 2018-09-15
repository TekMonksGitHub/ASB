/* 
 * main.js, Main ESB process
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

global.CONSTANTS = require(__dirname + "/constants.js");
const fs = require("fs");
let conf = require(CONSTANTS.ESBCONF);
require(`${CONSTANTS.LIBDIR}/langextensions.js`);

global.ESB = {};       // The global ESB namespace

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
                flowsToRun.push(JSON.parse(fs.readFileSync(`${CONSTANTS.FLOWSDIR}/${filename}`, "UTF-8")));
            } catch (err) {throw (`Bad flow ${filename}: ${err}`);}
        });
        runFlows(flowsToRun);

        LOG.info("Running...", true);
        console.log("Running...");
    } catch (err) {
        let errMsg = `FATAL: Can't read the flows, exiting: ${err}`;
        console.log(errMsg)
        LOG.error(errMsg, true); 
        process.exit(1);
    }
}

function runFlows(flows) {
    flows.forEach(flow => {
        if (flow.flow.disabled) return;   // skip disabled flows

        let routeNames = Object.keys(flow);
        routeNames.splice(routeNames.indexOf("flow"), 1);
        LOG.info(`[ESB] Starting flow: ${flow.flow.name}`);

        flow.env = {};
        routeNames.forEach(route => flow[route].flow = flow);   
        runFlow(flow, routeNames);
    });
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
                if (flow[routeName].isMessageGenerator) runFlowRoute(routeName, flow[routeName], messageContainer);
                else {
                    let dependencies = flow[routeName].dependencies;
                    if (!dependencies) dependencies = [[]];
                    if (!Array.isArray(dependencies)) dependencies = [[dependencies]];
                    if (!Array.isArray(dependencies[0])) dependencies = [dependencies];

                    let messages = getMessagesForRoute(messageContainer, routeName, dependencies);
                    messages.forEach(message => runFlowRoute(routeName, flow[routeName], messageContainer, message));
                }
            });
        } else {LOG.error(`[ESB] Can't run flow ${flow.flow.name} due to fatal error, skipping.`);}
    }

    setInterval(flowRun, conf.cpuInterval); // give back the CPU cycles
}

function getMessagesForRoute(messageContainer, routeName, dependencies) {
    let messages = [];
    messageContainer.messages.forEach(message => {
        if (!message.routesDone.includes(routeName) &&
                dependencies.some(dependenciesThis => dependenciesThis.isSubset(message.routesDone)))
            messages.push(message);
    });
    return messages;
}

function runFlowRoute(route, routeObj, messageContainer, message) {
    if (routeObj.isMessageConsumer) messageContainer.remove(message);   // message is now consumed

    let dirPath = route.replace(/[0-9|.]/g, "")+"s";
    require(`${CONSTANTS.ROOTDIR}/${dirPath}/${routeObj.type}.js`).start(route, routeObj, messageContainer, message);
}

module.exports = {bootstrap: bootstrap};
