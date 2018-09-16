/* 
 * rest.js - Calls a REST API
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const http = require(`${CONSTANTS.LIBDIR}/httpclient.js`);

exports.start = (routeName, httpclient, _messageContainer, message) => {
    if (message.env[routeName] && message.env[routeName].isProcessing) return;
    if (!message.env[routeName]) message.env[routeName] = {}; message.env[routeName].isProcessing = true;

    LOG.info(`[HTTP] HTTP call to ${httpclient.host}:${httpclient.port} with incoming message with timestamp: ${message.timestamp}`);

    if (httpclient.isSecure) httpclient.method = httpclient.method+"Https";         // handle secure calls
    if (httpclient.method == "delete") httpclient.method = "deleteHttp";            // delete is a reserved word in JS
    http[httpclient.method](httpclient.host, httpclient.port, httpclient.path, message.content, (error, data) =>{
        if (error) {
            LOG.error(`[HTTP] Call failed with error: ${error}`);
            message.addRouteDone(`${routeName}.error`);
            delete message.env[routeName];  // clean up our mess
        } else {
            message.addRouteDone(`${routeName}`);
            delete message.env[routeName];  // clean up our mess
            message.content = data;
            LOG.info(`[HTTP] Response received for message with timestamp: ${message.timestamp}`);
            LOG.debug(`[HTTP] Response data is: ${data}`);
        }
    });
}