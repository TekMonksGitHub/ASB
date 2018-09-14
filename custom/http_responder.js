/* 
 * http_listener.js, HTTP listener - HTTP listener implemented as a custom module
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

exports.start = (routeName, _output, _messageContainer, message) => {
    let response = message.http_listener.res;

    response.writeHead(200, {"Content-Type" : "application/json"});
    response.write(JSON.stringify(message.content));
    response.end();

    message.addRouteDone(routeName);
}