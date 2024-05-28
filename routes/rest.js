/* 
 * rest.js - Calls a REST API
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */
const restClient = require(`${CONSTANTS.LIBDIR}/rest.js`);

exports.start = (routeName, rest, _messageContainer, message) => {
    if (message.env[routeName] && message.env[routeName].isProcessing) return;
    if (!message.env[routeName]) message.env[routeName] = {}; message.env[routeName].isProcessing = true;
    message.setGCEligible(false);

    if (rest.url) {   // parse URLs here and prioritize them first, support parsed properties for URLs
        const urlToCall = new URL(rest.url);
        rest.port = urlToCall.port; rest.isSecure = urlToCall.protocol == "https:";
        rest.host = urlToCall.hostname; rest.path = urlToCall.pathname + urlToCall.search;
        if (!rest.method) rest.method = "get";
    }

    LOG.info(`[REST] REST call to ${rest.host}:${rest.port} with incoming message with timestamp: ${message.timestamp}`);

    if (!rest.port) rest.port = (rest.isSecure?443:80);           // handle ports

    if (rest.isSecure && !rest.method.endsWith("Https")) rest.method += "Https";         
    if (rest.method == "delete") rest.method = "deleteHttp";            // delete is a reserved word in JS

    let headers = {};                                                               // handle headers
    if (rest.headers) for (v of rest.headers) {
        const pair = v.split(":"); for (const [i,v] of pair.entries()) pair[i] = v.trim();
        const key = pair[0]; pair.splice(0,1); const value = pair.join(":");
        headers[key] = value;
    }

    rest.path = rest.path.trim(); if (!rest.path.startsWith("/")) rest.path = `/${rest.path}`;
    const callback = (error, data) => {
        if (error) {
            LOG.error(`[REST] Call failed with error: ${error}`);
            message.addRouteError(routeName);
            delete message.env[routeName];  // clean up our mess
            message.setGCEligible(true);
        } else {
            message.addRouteDone(`${routeName}`);
            delete message.env[routeName];  // clean up our mess
            message.setGCEligible(true);
            message.content = data;
            LOG.info(`[REST] Response received for message with timestamp: ${message.timestamp}`);
            LOG.debug(`[REST] Response data is: ${JSON.stringify(data)}`);
        }
    }
    
    if(!rest.isSecure) restClient[rest.method](rest.host, rest.port, rest.path, headers, 
        message.content, rest.timeout, callback );
    else restClient[rest.method](rest.host, rest.port, rest.path, headers, 
        message.content, rest.timeout, rest.sslObj, callback );
}