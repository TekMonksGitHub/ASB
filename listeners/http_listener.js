/* 
 * http_listener.js, HTTP listener - for any incoming HTTP requests.
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const urlMod = require("url");
const httpServerFactory = require(`${CONSTANTS.LIBDIR}/httpServerFactory.js`);

exports.start = (routeName, listener, messageContainer) => {
    if (listener.flow.env.server) return; // already listening

    listener.flow.env.server = httpServerFactory.createHTTPServer(listener);

    listener.flow.env.server.on("request", (req, res) => {
        const endPoint = urlMod.parse(req.url, true).pathname;
        if (endPoint != listener.url) return;   // not ours to handle

        let data = "";
        req.on("data", chunk => data += chunk);
		
		req.on("end", _ => {
            let message = MESSAGE_FACTORY.newMessage();
            message.env.http_listener = {listener, req, res};
            message.content = data;
            message.addRouteDone(routeName);
            messageContainer.add(message);
            LOG.info(`[HTTP_LISTENER] Injected new message with timestamp: ${message.timestamp}`);
            LOG.debug(`[HTTP_LISTENER] Incoming request: ${data}`);
        });
    });
}