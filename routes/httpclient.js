/* 
 * httpclient.js - Calls a HTTP endpoint
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const http = require(`${CONSTANTS.LIBDIR}/httpclient.js`);

exports.start = (routeName, httpclient, _messageContainer, message) => {
    if (message.env[routeName] && message.env[routeName].isProcessing) return;
    if (!message.env[routeName]) message.env[routeName] = {}; message.env[routeName].isProcessing = true;

    LOG.info(`[HTTP] HTTP call to ${httpclient.host}:${httpclient.port} with incoming message with timestamp: ${message.timestamp}`);

    if (!httpclient.port) httpclient.port = (httpClient.isSecure?443:80);           // handle ports

    if (httpclient.isSecure) httpclient.method = httpclient.method+"Https";         // handle secure calls
    if (httpclient.method == "delete") httpclient.method = "deleteHttp";            // delete is a reserved word in JS

    let headers = {};                                                               // handle headers
    if (httpclient.headers) httpclient.headers.forEach(v => {
        let pair = v.split(":"); pair.forEach((v, i) => pair[i] = v.trim());
        let key = pair[0]; pair.splice(0,1); let value = pair.join("");
        headers[key] = value;
    });

    http[httpclient.method](httpclient.host, httpclient.port, httpclient.path, headers, message.content, (error, data) =>{
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