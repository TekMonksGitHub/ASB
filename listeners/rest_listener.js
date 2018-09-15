/* 
 * rest_listener.js, REST API listener - for REST API support
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const http = require("http");
const urlMod = require("url");

exports.start = (routeName, listener, messageContainer) => {
    if (listener.flow.env.server) return; // already listening

    let server = http.createServer().listen(listener.port);
    listener.flow.env.server = server;

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

            let message = MESSAGE_FACTORY.newMessage();
            message.rest_listener = {listener, req, res};
            message.content = content;
            message.addRouteDone(routeName);
            messageContainer.add(message);
            LOG.info(`[HTTP_LISTENER] Injected new message`);
            LOG.debug(`[HTTP_LISTENER] Incoming request: ${data}`);
        });
    });
}