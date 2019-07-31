/* 
 * rest.js - Calls a REST API
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const restClient = require(`${CONSTANTS.LIBDIR}/rest.js`);
const url = require('url');

exports.start = (routeName, rest, _messageContainer, message) => {
    if (message.env[routeName] && message.env[routeName].isProcessing) return;
    if (!message.env[routeName]) message.env[routeName] = {}; message.env[routeName].isProcessing = true;
    message.setGCEligible(false);

    LOG.info(`[REST] REST call to ${rest.host}:${rest.port} with incoming message with timestamp: ${message.timestamp}`);

    if (rest.isSecure && !rest.method.endsWith("Https")) rest.method += "Https";           
    if (rest.method == "delete") rest.method = "deleteHttp";        // delete is a reserved word in JS

    let headers = {};                                               // handle headers
    if(rest.authorization) headers['Authorization'] = `Basic ${new Buffer(`${rest.username}:${rest.password}`).toString('base64')}`;
    if (rest.headers) rest.headers.forEach(v => {
        let pair = v.split(":"); pair.forEach((v, i) => pair[i] = v.trim());
        let key = pair[0]; pair.splice(0,1); let value = pair.join("");
        headers[key] = value;
    });

    if (!rest.path.startsWith("/")) rest.path = `/${rest.path.trim()}`;

    if(rest.query) message.content = url.parse("$filter=(Code eq '1234')").path;

    restClient[rest.method](rest.host, rest.port, rest.path, headers, message.content, (error, data) =>{
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
    });
}