/* 
 * https_listener.js, HTTPS listener - for any incoming HTTPS requests.
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const urlMod = require("url");
const httpServerFactory = require(`${CONSTANTS.LIBDIR}/httpServerFactory.js`);

exports.start = (routeName, listener, messageContainer) => {
    if (listener.flow.env.server) return; // already listening

    listener.flow.env.server = httpServerFactory.createHTTPSServer(listener);

    listener.flow.env.server.on("request", (req, res) => {
        const endPoint = urlMod.parse(req.url, true).pathname;
        if (endPoint != listener.url) return;   // not ours to handle

        let data = "";
        req.on("data", chunk => data += chunk);
		
		req.on("end", _ => {
            const message = MESSAGE_FACTORY.newMessageAllocSafe();
            if (!message) {
                LOG.error("[HTTPS_LISTENER] Message creation error, throttling listener."); 
                res.writeHead(429, {"Content-Type": "text/plain"});
                res.write("Throttled.\n");
                res.end();
            } else {
                message.env.https_listener = {listener, req, res};
                message.content = data;
                message.addRouteDone(routeName);
                messageContainer.add(message);
                LOG.info(`[HTTPS_LISTENER] Injected new message with timestamp: ${message.timestamp}`);
                LOG.debug(`[HTTPS_LISTENER] Incoming request: ${data}`);
            }
        });
    });
}