/* 
 * aiinsights_push.js - Pushes the gives JSON message to the AIInsights engine
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const rest = require(CONSTANTS.LIBDIR+"/rest.js");
const http = require(CONSTANTS.LIBDIR+"/httpclient.js");

exports.start = (routeName, aiinsights_push, _messageContainer, message) => {
    message.setGCEligible(false);       // re-route all to us, if we process it we will set it to GC eligible anyway

    if ( (aiinsights_push.flow.env[routeName] && aiinsights_push.flow.env[routeName].searchIndexBeingCreated) || 
        (message.env[routeName] && message.env[routeName].isBeingWorkedOn) ) return;

    message.env[routeName] = {};
    message.env[routeName].isBeingWorkedOn = true; 

    let postMessage = _ => {
        LOG.debug(`[AIINSIGHTS_PUSH] Posting message with timestamp ${message.timestamp}`);

        // if caching for bulk, setTimeout so if messages stop before bulk post limit is reached, 
        // we still post the last incomplete batch, when the timeout fires
        if (!aiinsights_push.flow.env[routeName].messageStack.length)
            aiinsights_push.flow.env[routeName].timeout = 
                setTimeout(createDocuments, aiinsights_push.bulk_timeout, aiinsights_push, routeName, handleBulkResult);

        aiinsights_push.flow.env[routeName].messageStack.push(message);     // batch it for bulk
        
        if (aiinsights_push.flow.env[routeName].messageStack.length % aiinsights_push.bulk_push_size == 0) {
            // no need to try to post on timeout, batch complete
            if (aiinsights_push.flow.env[routeName].timeout) {
                clearTimeout(aiinsights_push.flow.env[routeName].timeout);
                delete aiinsights_push.flow.env[routeName].timeout
            }

            createDocuments(aiinsights_push, routeName, handleBulkResult);  // batch full, post them

            aiinsights_push.flow.env[routeName].messageStack = []; 
        }
    }

    if (!aiinsights_push.flow.env[routeName] || !aiinsights_push.flow.env[routeName].previouslyCalled) {
        if (!aiinsights_push.flow.env[routeName]) {
            aiinsights_push.flow.env[routeName] = {};
            aiinsights_push.flow.env[routeName].previouslyCalled = true; 
            aiinsights_push.flow.env[routeName].searchIndexBeingCreated = true;
            aiinsights_push.flow.env[routeName].messageStack = [];
        }
        
        createSearchIndex(aiinsights_push, message, err => {
            delete aiinsights_push.flow.env[routeName].searchIndexBeingCreated; 
            if (err) handleError(message, routeName, err); 
            else postMessage();
        });
    } else postMessage();
}

// callback error, result, status
function createDocuments(aiinsights_push, routeName, cb) {
    let msgStack = aiinsights_push.flow.env[routeName].messageStack;
    let postRequest = getBulkCreateRequest(msgStack, aiinsights_push.index, aiinsights_push.index_type);

    let poster = aiinsights_push.host_secure ? http.postHttps : http.post;
    poster(aiinsights_push.host, aiinsights_push.port, `/_bulk`, 
            {"Content-Type":"application/x-ndjson"}, postRequest, 
            (err, result, status) => cb(msgStack, routeName, err, result, status));
}

function getBulkCreateRequest(messages, index, doctype) {
    let req = "";
    messages.forEach(m =>{
        req += `{"index":{"_index":"${index}","_type":"${doctype}"}}\n`;
        req += JSON.stringify(m.content)+"\n";
    })
    return req;
}

function createSearchIndex(aiinsights_push, message, cb) {
    LOG.info("[AIINSIGHTS_PUSH] Connecting to AI Insights Search...");

    let getter = aiinsights_push.host_secure?rest.getHttps:rest.get;
    getter(aiinsights_push.host, aiinsights_push.port, aiinsights_push.index, {}, null, (err, _, status)=>{
        if (err) {cb(err); return;}

        if (status == 404) {
            let type = aiinsights_push.index_type;
            let elasticIndex = {}; elasticIndex.mappings = {}; elasticIndex.mappings[type] = {}; 
            elasticIndex.mappings[type].properties = {}; elasticIndex.settings = {};

            if (aiinsights_push.shards) elasticIndex.settings.number_of_shards = aiinsights_push.shards;
            if (aiinsights_push.replicas) elasticIndex.settings.number_of_replicas = aiinsights_push.replicas;

            Object.keys(message.content).forEach(key => {
                elasticIndex.mappings[type].properties[key]={};
    
                if (aiinsights_push.fieldtypes && Object.keys(aiinsights_push.fieldtypes).includes(key))
                    elasticIndex.mappings[type].properties[key].type = aiinsights_push.fieldtypes[key];
                else
                    elasticIndex.mappings[type].properties[key].type = "keyword";

                if (aiinsights_push.fieldformats && Object.keys(aiinsights_push.fieldformats).includes(key))
                    elasticIndex.mappings[type].properties[key].format = aiinsights_push.fieldformats[key];
            });

            let putter = aiinsights_push.host_secure?rest.putHttps:rest.put;
            putter(aiinsights_push.host, aiinsights_push.port, aiinsights_push.index, {}, elasticIndex, (err, _, status) => {
                if (err) cb(err);
                else if (status != 200) cb(`Error: Unable to create Elastic index. Error code: ${status}`);
                else cb();
            });
        } else if (status == 200) cb(); else cb(`Error: Elastic error: ${status}`);
    });
}

function handleBulkResult(msgStack, routeName, err, result, status) {
    LOG.debug(`[AIINSIGHTS_PUSH] Result of posting messages: ${result}`);
    if (err) handleError(msgStack, routeName, err);
    if (status == 200 || status == 201) handleSuccess(msgStack, routeName);
    else handleError(msgStack, routeName, `Return status = ${status}`);
}

function handleError(messages, routeName, e) {
    messages.forEach(message => {
        LOG.error(`[AIINSIGHTS_PUSH] error: ${e}, giving up`); 
        message.addRouteError(routeName);
        delete message.env[routeName];  // clean up
        message.setGCEligible(true);    // we are done, GC it 
    });
}

function handleSuccess(messages, routeName) {
    messages.forEach(message => {
        LOG.info(`[AIINSIGHTS_PUSH] Created document for message with timestamp, ${message.timestamp}`); 
        message.addRouteDone(routeName);
        delete message.env[routeName];  // clean up
        message.setGCEligible(true);    // we are done, GC it 
    });
}