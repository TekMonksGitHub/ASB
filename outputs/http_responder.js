/* 
 * http_responder.js, HTTP responder - for generic HTTP responses
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const httpServerFactory = require(`${CONSTANTS.LIBDIR}/httpServerFactory.js`);

exports.start = (routeName, http_responder, _messageContainer, message) => {
    ASBLOG.info(`[HTTP_RESPONDER] Sending response, message with timestamp: ${message.timestamp}`);

    const response = message.env.http_listener.res;

    if (!http_responder.code || http_responder.code == 200) httpServerFactory.send200Reply(response, message.content, 
        http_responder.content_type, message.env.http_listener.listener.allow_origin);
    
    if (http_responder.code == 500) httpServerFactory.send500Reply(response, message.content, 
        http_responder.content_type, message.env.http_listener.listener.allow_origin);

    message.addRouteDone(routeName);
}