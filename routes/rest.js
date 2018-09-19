/* 
 * rest.js - Calls a REST API
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const restClient = require(`${CONSTANTS.LIBDIR}/rest.js`);

exports.start = (routeName, rest, _messageContainer, message) => {
    if (message.env[routeName] && message.env[routeName].isProcessing) return;
    if (!message.env[routeName]) message.env[routeName] = {}; message.env[routeName].isProcessing = true;

    LOG.info(`[REST] REST call to ${rest.host}:${rest.port} with incoming message with timestamp: ${message.timestamp}`);

    if (rest.isSecure) rest.method = rest.method+"Https";           // handle secure calls
    if (rest.method == "delete") rest.method = "deleteHttp";        // delete is a reserved word in JS

    let headers = {};                                               // handle headers
    if (rest.headers) rest.headers.forEach(v => {
        let pair = v.split(":"); pair.forEach((v, i) => pair[i] = v.trim());
        let key = pair[0]; pair.splice(0,1); let value = pair.join("");
        headers[key] = value;
    });

    restClient[rest.method](rest.host, rest.port, rest.path, headers, message.content, (error, data) =>{
        if (error) {
            LOG.error(`[REST] Call failed with error: ${error}`);
            message.addRouteError(routeName);
            delete message.env[routeName];  // clean up our mess
        } else {
            message.addRouteDone(`${routeName}`);
            delete message.env[routeName];  // clean up our mess
            message.content = data;
            LOG.info(`[REST] Response received for message with timestamp: ${message.timestamp}`);
            LOG.debug(`[REST] Response data is: ${JSON.stringify(data)}`);
        }
    });
}