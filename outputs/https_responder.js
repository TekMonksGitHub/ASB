/* 
 * https_responder.js, HTTPS responder - for generic HTTPS responses
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const httpServerFactory = require(`${CONSTANTS.LIBDIR}/httpServerFactory.js`);

exports.start = (routeName, https_responder, _messageContainer, message) => {
    LOG.info(`[HTTP_RESPONDER] Sending response, message with timestamp: ${message.timestamp}`);

    const response = message.env.https_listener.res;

    if (!https_responder.code || https_responder.code == 200) httpServerFactory.send200Reply(response, message.content, 
        https_responder.content_type, message.env.https_listener.listener.allow_origin);
    
    if (https_responder.code == 500) httpServerFactory.send500Reply(response, message.content, 
        https_responder.content_type, message.env.https_listener.listener.allow_origin);

    message.addRouteDone(routeName);
}