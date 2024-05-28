/* 
 * httpclient.js - Calls a HTTP endpoint
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */
const http = require(`${CONSTANTS.LIBDIR}/httpclient.js`);

exports.start = (routeName, httpclient, _messageContainer, message) => {
    if (message.env[routeName] && message.env[routeName].isProcessing) return;
    if (!message.env[routeName]) message.env[routeName] = {}; message.env[routeName].isProcessing = true;
    message.setGCEligible(false);

    if (httpclient.url) {   // parse URLs here and prioritize them first, support parsed properties for URLs
        const urlToCall = new URL(httpclient.url);
        httpclient.port = urlToCall.port; httpclient.isSecure = urlToCall.protocol == "https:";
        httpclient.host = urlToCall.hostname; httpclient.path = urlToCall.pathname + urlToCall.search;
        if (!httpclient.method) httpclient.method = "get";
    }

    LOG.info(`[HTTP] HTTP call to ${httpclient.host}:${httpclient.port} with incoming message with timestamp: ${message.timestamp}`);

    if (!httpclient.port) httpclient.port = (httpclient.isSecure?443:80);           // handle ports

    if (httpclient.isSecure && !httpclient.method.endsWith("Https")) httpclient.method += "Https";         
    if (httpclient.method == "delete") httpclient.method = "deleteHttp";            // delete is a reserved word in JS

    let headers = {};                                                               // handle headers
    if (httpclient.headers) for (v of httpclient.headers) {
        const pair = v.split(":"); for (const [i,v] of pair.entries()) pair[i] = v.trim();
        const key = pair[0]; pair.splice(0,1); const value = pair.join(":");
        headers[key] = value;
    }

    httpclient.path = httpclient.path.trim(); if (!httpclient.path.startsWith("/")) httpclient.path = `/${httpclient.path}`;
    const callback = (error, data) => {
        if (error) {
            LOG.error(`[HTTP] Call failed with error: ${error}, for message with timestamp: ${message.timestamp}`);
            message.addRouteError(routeName);
            delete message.env[routeName];  // clean up our mess
            message.setGCEligible(true);
        } else {
            message.addRouteDone(routeName);
            delete message.env[routeName];  // clean up our mess
            message.setGCEligible(true);
            message.content = httpclient.isBinary?data:data.toString("utf8");
            LOG.info(`[HTTP] Response received for message with timestamp: ${message.timestamp}`);
            LOG.debug(`[HTTP] Response data is: ${message.content}`);
        }
    }

    if(!httpclient.isSecure) http[httpclient.method](httpclient.host, httpclient.port, httpclient.path, headers, 
        message.content, httpclient.timeout, callback);
    else http[httpclient.method](httpclient.host, httpclient.port, httpclient.path, headers, 
        message.content, httpclient.timeout, httpclient.sslObj, callback);
}