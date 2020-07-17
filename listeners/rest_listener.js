/* 
 * rest_listener.js, REST API listener - for REST API support
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const urlMod = require("url");
const httpServerFactory = require(`${CONSTANTS.LIBDIR}/httpServerFactory.js`);

exports.start = (routeName, listener, messageContainer) => {
    if (listener.flow.env[routeName] && listener.flow.env[routeName].server) return; // already listening

    listener.flow.env[routeName] = {"server":httpServerFactory.createHTTPServer(listener)};

    listener.flow.env[routeName].server.on("request", (req, res) => {
        let endPoint = urlMod.parse(req.url, true).pathname;
        if (endPoint != listener.url) return;   // not ours to handle

        let data = "";
        req.on("data", chunk => data += chunk);
		
		req.on("end", _ => {
            let content;
            try {content = JSON.parse(data);} catch (err) {
                LOG.error("[REST_LISTENER] Bad incoming request, dropping.");
                res.writeHead(500, {"Content-Type": "text/plain"});
                res.write("Bad request.\n");
                res.end();
                return;
            }

            const message = MESSAGE_FACTORY.newMessage();
            message.env.http_listener = {listener, req, res};
            message.content = content;
            message.addRouteDone(routeName);
            messageContainer.add(message);
            LOG.info(`[REST_LISTENER] Injected new message with timestamp: ${message.timestamp}`);
            LOG.debug(`[REST_LISTENER] Incoming request: ${data}`);
        });
    });
}