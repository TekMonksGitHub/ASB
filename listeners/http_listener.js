/* 
 * http_listener.js, HTTP listener - for any incoming HTTP requests.
 * 
 * (C) 2024 TekMonks. All rights reserved.
 */

const httpServerFactory = require(`${ASBCONSTANTS.LIBDIR}/httpServerFactory.js`);

exports.start = (routeName, listener, messageContainer) => {
    if ((listener.flow.env[routeName] && listener.flow.env[routeName].server) ||
        (listener.flow.env[routeName] && listener.flow.env[routeName].creatingServer)) return; // already listening or creating

    listener.flow.env[routeName]= {"creatingServer" : true};


    httpServerFactory.createHTTPServer(listener, (err, server) => {
        if (err) {
            ASBLOG.error(`[HTTP_LISTENER] Unable to create server due to ${err}, disabling the flow`);
            delete listener.flow.env[routeName].creatingServer; throw (err);
        }

        listener.flow.env[routeName] = {server};
        delete listener.flow.env[routeName].creatingServer; // done

        listener.flow.env[routeName].server.on("request", (req, res) => {
            const baseurl = `${listener.isSecure?"https":"http"}://${listener.host}:${listener.port}`;
            const endPoint = new URL(req.url, baseurl).pathname;
            if (endPoint != listener.url) return;   // not ours to handle

            const data = [];
            req.on("data", chunk => data.push(chunk));

            req.on("end", _ => {
                const message = MESSAGE_FACTORY.newMessageAllocSafe();
                if (!message) {
                    ASBLOG.error("[HTTP_LISTENER] Message creation error, throttling listener.");
                    res.writeHead(429, {"Content-Type": "text/plain"});
                    res.write("Throttled.\n");
                    res.end();
                } else {
                    message.env.http_listener = {listener, req, res};
                    message.content = listener.contentType?.toLowerCase() === "binary"
                        ? Buffer.concat(data)
                        : Buffer.concat(data).toString("utf8");
                    message.addRouteDone(routeName);
                    messageContainer.add(message);
                    ASBLOG.info(`[HTTP_LISTENER] Injected new message with timestamp: ${message.timestamp}`);
                    if (listener.contentType?.toLowerCase() === "binary") {
                        ASBLOG.debug(`[HTTP_LISTENER] Incoming request contains binary data.`);
                    } else {
                        ASBLOG.debug(`[HTTP_LISTENER] Incoming request: ${message.content}`);
                    }
                }
            });
        });
    });
}