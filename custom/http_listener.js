/* 
 * http_listener.js, HTTP listener - HTTP listener implemented as a custom module
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const http = require("http");
const urlMod = require("url");
let server = null; 

exports.start = (routeName, listener, messageContainer, message_factory) => {
    if (server) return; // already listening

    server = http.createServer((_, res) => res.setHeader("Access-Control-Allow-Origin", "*")).listen(listener.port);

    server.on("request", (req, res) => {
        let endPoint = urlMod.parse(req.url, true).pathname;
        if (endPoint != listener.url) {
            LOG.error(`[HTTP_LISTENER] Bad URL: ${req.url}, sending 404`);
            res.writeHead(404, {"Content-Type": "text/plain"});
            res.write("404 Not found.\n");
            res.end();
            return;
        }

        let data = "";
        req.on("data", chunk => data += chunk);
		
		req.on("end", _ => {
            let content;
            try {content = JSON.parse(data);} catch (err) {
                LOG.error("[HTTP_LISTENER] Bad incoming request, dropping.");
                res.writeHead(500, {"Content-Type": "text/plain"});
                res.write("Bad request.\n");
                res.end();
                return;
            }

            let message = message_factory.newMessage();
            message.http_listener = {req, res};
            message.content = content;
            message.addRouteDone(routeName);
            messageContainer.add(message);
            LOG.info(`[HTTP_LISTENER] Injected new message`);
            LOG.debug(`[HTTP_LISTENER] Incoming request: ${data}`);
        });
    });
}