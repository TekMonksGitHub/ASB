/* 
 * write_file.js, WRITE FILE Listener - for WRITE FILE
 * 
 * (C) 2024 TekMonks. All rights reserved.
 */

const urlMod = require("url");
const fs = require('fs');
const httpServerFactory = require(`${CONSTANTS.LIBDIR}/httpServerFactory.js`);

exports.start = (routeName, listener, messageContainer) => {
    if ((listener.flow.env[routeName] && listener.flow.env[routeName].server) ||
        (listener.flow.env[routeName] && listener.flow.env[routeName].creatingServer)) return; // already listening or creating

    listener.flow.env[routeName] = { "creatingServer": true };


    httpServerFactory.createHTTPServer(listener, (err, server) => {
        if (err) {
            LOG.error(`[REST_LISTENER] Unable to create server due to ${err}, disabling the flow`);
            delete listener.flow.env[routeName].creatingServer; throw (err);
        }
        listener.flow.env[routeName] = { server };
        delete listener.flow.env[routeName].creatingServer; // done

        listener.flow.env[routeName].server.on("request", (req, res) => {
            let endPoint = urlMod.parse(req.url, true).pathname;
            if (endPoint != listener.url) return;   // not ours to handle

            let chunks = [];

            req.on('data', chunk => {
                chunks.push(chunk);
            });
            let buffer;
            req.on('end', () => {
                try {
                    buffer = Buffer.concat(chunks);
                } catch (err) {
                    console.error("[write_file] Bad incoming request, dropping.", err);
                    res.writeHead(500, { "Content-Type": "text/plain" });
                    res.write("Bad request.\n");
                    res.end();
                }

                const message = MESSAGE_FACTORY.newMessageAllocSafe();
                if (!message) {
                    LOG.error("[write_file] Message creation error, throttling listener.");
                    res.writeHead(429, { "Content-Type": "text/plain" });
                    res.write("Throttled.\n");
                    res.end();
                } else {
                    message.env.http_listener = { listener, req, res };
                    message.content.buffer = buffer;
                    message.addRouteDone(routeName);
                    messageContainer.add(message);
                    LOG.info(`[write_file] Injected new message with timestamp: ${message.timestamp}`);
                }
            });
        });
    });
}

