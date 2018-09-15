/* 
 * http_responder.js, HTTP responder - for generic HTTP responses
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const httpServerFactory = require(`${CONSTANTS.LIBDIR}/httpServerFactory.js`);

exports.start = (routeName, http_responder, _messageContainer, message) => {
    let response = message.env.http_listener.res;

    httpServerFactory.send200Reply(response, message.content, http_responder.content_type, 
        message.env.http_listener.listener.allow_origin);

    message.addRouteDone(routeName);
}