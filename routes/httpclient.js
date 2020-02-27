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

    LOG.info(`[HTTP] HTTP call to ${httpclient.host}:${httpclient.port} with incoming message with timestamp: ${message.timestamp}`);

    if (!httpclient.port) httpclient.port = (httpClient.isSecure?443:80);           // handle ports

    if (httpclient.isSecure && !httpclient.method.endsWith("Https")) httpclient.method += "Https";         
    if (httpclient.method == "delete") httpclient.method = "deleteHttp";            // delete is a reserved word in JS

    let headers = {};                                                               // handle headers
    if (httpclient.headers) httpclient.headers.forEach(v => {
        let pair = v.split(":"); pair.forEach((v, i) => pair[i] = v.trim());
        const key = pair[0]; pair.splice(0,1); const value = pair.join("");
        headers[key] = value;
    });

    http[httpclient.method](httpclient.host, httpclient.port, httpclient.path, headers, message.content, 
            httpclient.timeout, (error, result) => {

        if (error) {
            LOG.error(`[HTTP] Call failed with error: ${error}`);
            message.addRouteError(routeName);
            delete message.env[routeName];  // clean up our mess
            message.setGCEligible(true);
        } else {
            message.addRouteDone(`${routeName}`);
            delete message.env[routeName];  // clean up our mess
            message.setGCEligible(true);
            message.content = result.response;
            LOG.info(`[HTTP] Response received for message with timestamp: ${message.timestamp}`);
            LOG.debug(`[HTTP] Response data is: ${result.response}`);
        }
    });
}