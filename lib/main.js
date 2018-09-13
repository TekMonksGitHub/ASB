/* 
 * main.js, Main ESB process
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

global.CONSTANTS = require(__dirname + "/constants.js");
const fs = require("fs");
const conf = require(CONSTANTS.ESBCONF);

// support starting in stand-alone config
if (require("cluster").isMaster) bootstrap();

function bootstrap() {
    console.log("Starting the ESB...");

    /* Init the logs */
	console.log("Initializing the logs.");
    require(CONSTANTS.LIBDIR+"/log.js").initGlobalLogger(CONSTANTS.LOGMAIN);

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
        let nodes = Object.keys(flow);
        nodes.splice(modules.indexOf("name"), 1);
        LOG.info(`[ESB] Starting flow: ${flow.name}`);
        runFlow(flow, nodes);
    });
}

function runFlow(flow, nodes) {
    let messageContainer = {messages:[], add = message => messages.push(message), fatalError: false};

    let flowRun = _ => {
        if (!messageContainer.fatalError) {
            nodes.forEach(node => {
                if (flow[node].isMessageGenerator) runFlowNode(node, flow[node], messageContainer);
                else {
                    let messages = getMessagesForNode(messageContainer, node, flow[node].dependencies);
                    messages.forEach(message => runFlowNode(node, flow[node], messageContainer, message));
                }
            });
        } else {LOG.error(`[ESB] Can't run flow ${flow.name} due to fatal error, skipping.`);}
    }

    setInterval(flowRun, conf.cpuInterval); // give back the CPU cycles
}

function getMessagesForNode(messageContainer, nodeName, dependencies) {
    let messages = [];
    forEach(messageContainer.messages, message => {
        if (!message.nodesDone.includes(nodeName) &&
                dependencies.every(dependency => message.nodesDone.includes(dependency))) 
            messages.push(message);
    });
    return messages;
}

function runFlowNode(node, flow, messageContainer, message) {
    let nodeObj = flow[node];
    let dirPath = node.replace(/[0-9]/g, "")+"s";
    require(`CONSTANTS.ROOTDIR/${dirPath}/${nodeObj.type}.js`).start(nodeObj, node, messageContainer, message);
}

module.exports = {bootstrap: bootstrap};
