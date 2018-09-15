/* 
 * rest_responder.js, REST responder - for REST API support
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const httpServerFactory = require(`${CONSTANTS.LIBDIR}/httpServerFactory.js`);

exports.start = (routeName, _output, _messageContainer, message) => {
    let response = message.env.http_listener.res;

    httpServerFactory.send200Reply(response, JSON.stringify(message.content), "application/json", 
        message.env.http_listener.listener.allow_origin);

    message.addRouteDone(routeName);
}