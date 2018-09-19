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
    message.setGCEligible(false);       // we are working on this message, so don't thrash it yet.

    let postMessage = err => {
        if (err) {LOG.error(`[AIINSIGHTS_PUSH] Error: ${err}, giving up`); message.addRouteError(routeName);;; return;}

        let poster = aiinsights_push.host_secure?rest.postHttps:rest.post;
        poster(aiinsights_push.host, aiinsights_push.port, `${aiinsights_push.index}/doc`, message.content, (err, result, status) =>{
            let handleError = e => {
                LOG.error(`[AIINSIGHTS_PUSH] error: ${e}, giving up`); 
                message.addRouteError(routeName);
                delete message.env[routeName];  // clean up
                message.setGCEligible(true);    // we are done, GC it if you want
            }
            if (err) handleError(err);

            if (status == 200 || status == 201) {
                LOG.info(`[AIINSIGHTS_PUSH] Created document, ${result}`); 
                message.addRouteDone(routeName);
                delete message.env[routeName];  // clean up
                message.setGCEligible(true);    // we are done, GC it if you want
            } else handleError(`status = ${status}`)
        });
    }

    if (!aiinsights_push.flow.env[routeName] || !aiinsights_push.flow.env[routeName].previouslyCalled) {
        if (!aiinsights_push.flow.env[routeName]) aiinsights_push.flow.env[routeName] = {};
        aiinsights_push.flow.env[routeName].previouslyCalled = true; 
        aiinsights_push.flow.env[routeName].searchIndexBeingCreated = true;
        createSearchIndex(aiinsights_push, message, err => {
            delete aiinsights_push.flow.env[routeName].searchIndexBeingCreated; 
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