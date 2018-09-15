/* 
 * rest_responder.js, REST responder - for REST API support
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

exports.start = (routeName, _output, _messageContainer, message) => {
    let response = message.rest_listener.res;

    if (!message.rest_listener.listener.allow_origin) response.setHeader("Access-Control-Allow-Origin", "*")
    else response.setHeader("Access-Control-Allow-Origin", message.rest_listener.listener.allow_origin);

    response.writeHead(200, {"Content-Type" : "application/json"});
    response.write(JSON.stringify(message.content));
    response.end();

    message.addRouteDone(routeName);
}