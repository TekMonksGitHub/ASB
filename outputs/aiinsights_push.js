/* 
 * aiinsights_push.js - Pushes the gives JSON message to the AIInsights engine
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const rest = require(CONSTANTS.LIBDIR+"/rest.js");

exports.start = (routeName, aiinsights_push, _messageContainer, message) => {
    if (aiinsights_push.flow.env.searchIndexBeingCreated || 
        (message.env[routeName] && message.env[routeName].isBeingWorkedOn)) return;

    message.env[routeName] = {};
    message.env[routeName].isBeingWorkedOn = true;

    let postMessage = err => {
        if (err) {LOG.error(`[AIINSIGHTS_PUSH] Error: ${err}, giving up`); message.addRouteDone(`${routeName}.error`);; return;}

        let poster = aiinsights_push.host_secure?rest.postHttps:rest.post;
        poster(aiinsights_push.host, aiinsights_push.port, `${aiinsights_push.index}/doc`, message.content, (err, result, status) =>{
            if (err) {LOG.error(`[AIINSIGHTS_PUSH] Error: ${err}, giving up`); message.addRouteDone(`${routeName}.error`);; return;}

            if (status == 200 || status == 201) {
                LOG.info(`[AIINSIGHTS_PUSH] Created document, ${result}`); 
                message.addRouteDone(routeName);
                message.env[routeName].isBeingWorkedOn = false;
            } else {
                LOG.error(`[AIINSIGHTS_PUSH] error, status = ${status}, giving up`); 
                message.addRouteDone(`${routeName}.error`);; 
                return;
            }
        });
    }

    if (!aiinsights_push.flow.env.previouslyCalled) {
        aiinsights_push.flow.env.previouslyCalled = true; 
        aiinsights_push.flow.env.searchIndexBeingCreated = true;
        createSearchIndex(aiinsights_push, message, err => {
            aiinsights_push.flow.env.searchIndexBeingCreated = false; 
            postMessage(err);
        });
    } else postMessage();
}

function createSearchIndex(aiinsights_push, message, cb) {
    LOG.info("[AIINSIGHTS_PUSH] Connecting to AI Insights Search...");

    let getter = aiinsights_push.host_secure?rest.getHttps:rest.get;
    getter(aiinsights_push.host, aiinsights_push.port, aiinsights_push.index, null, (err, _, status)=>{
        if (err) {cb(err); return;}

        if (status == 404) {
            let elasticIndex = {}; elasticIndex.mappings = {}; elasticIndex.mappings.doc = {}; 
            elasticIndex.mappings.doc.properties = {}; 
            Object.keys(message.content).forEach(key => {
                elasticIndex.mappings.doc.properties[key]={};
    
                if (aiinsights_push.fieldtypes && Object.keys(aiinsights_push.fieldtypes).includes(key))
                    elasticIndex.mappings.doc.properties[key].type = aiinsights_push.fieldtypes[key];
                else
                    elasticIndex.mappings.doc.properties[key].type = "keyword";

                if (aiinsights_push.fieldformats && Object.keys(aiinsights_push.fieldformats).includes(key))
                    elasticIndex.mappings.doc.properties[key].format = aiinsights_push.fieldformats[key];
            });

            let putter = aiinsights_push.host_secure?rest.putHttps:rest.put;
            putter(aiinsights_push.host, aiinsights_push.port, aiinsights_push.index, elasticIndex, (err, _, status) => {
                if (err) cb(err);
                else if (status != 200) cb(`Error: Unable to create Elastic index. Error code: ${status}`);
                else cb();
            });
        } else if (status == 200) cb(); else cb(`Error: Elastic error: ${status}`);
    });

}