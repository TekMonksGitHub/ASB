/* 
 * rest_responder.js, REST responder - for REST API support
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const serverFactory = require(`${CONSTANTS.LIBDIR}/serverFactory.js`);

exports.start = (routeName, _output, _messageContainer, message) => {
    LOG.info(`[REST_RESPONDER] Sending response, message with timestamp: ${message.timestamp}`);

    const response = message.env.http_listener.res;

    serverFactory.send200Reply(response, JSON.stringify(message.content), "application/json", 
        message.env.http_listener.listener.allow_origin);

    message.addRouteDone(routeName);
}