/* 
 * rest_responder.js, REST responder - for REST API support
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

exports.start = (routeName, _output, _messageContainer, message) => {
    let response = message.rest_listener.res;

    response.writeHead(200, {"Content-Type" : "application/json"});
    response.write(JSON.stringify(message.content));
    response.end();

    message.addRouteDone(routeName);
}