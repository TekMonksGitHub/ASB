/* 
 * httpServerFactory.js, HTTP server factory
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */
const fs = require("fs");
const http = require("http");
const https = require("https");

ESB.env.HTTPSERVERS = {};

exports.createHTTPServer = (listenerObj, callback) => {
    const host = listenerObj.host || "::";  
    const port = listenerObj.port || 8080;  
    const serverKey = `${host}:${port}`;
    let server = ESB.env.HTTPSERVERS[serverKey];

    if (server) {
        initServer(server, listenerObj);
        return callback(null, server);
    }

    const startServer = (sslOptions) => {
        server = listener.isSecure ? https.createServer(sslOptions) : http.createServer();
        server.listen(port, host);
        initServer(server, listener);
        ESB.env.HTTPSERVERS[serverKey] = server;
        ASBLOG.info(`[HTTP_SERVER_FACTORY] ${listener.isSecure ? "HTTPS" : "HTTP"} server listening on ${host}:${port}`);
        callback(null, server);
    };

    const listener=listenerObj.flow.listener
    
    if (listener.isSecure) {
        createSSLOptions(listener.keyFile , listener.certFile , (err, sslOptions) => {
            if (err) return callback(err);
            startServer(sslOptions);
        });
    } else {
        startServer();
    }
};

exports.send200Reply = (res, reply, content_type, allow_origin) => {
    res.setHeader("Access-Control-Allow-Origin", allow_origin?allow_origin:"*");

    if (!content_type) content_type = "text/plain";

    res.writeHead(200, {
        "Content-Length": Buffer.byteLength(reply),
        "Content-Type" : content_type,
    });
    res.write(reply);
    res.end();
}

exports.send500Reply = (res, reply="Internal Error", content_type="text/html; charset=utf-8", allow_origin) => {
    res.setHeader("Access-Control-Allow-Origin", allow_origin?allow_origin:"*");

    if (!content_type) content_type = "text/plain";

    res.writeHead(500, {
        "Content-Length": Buffer.byteLength(reply),
        "Content-Type" : content_type,
    });
    res.write(reply);
    res.end();
}

function initServer(server, listener) {
    if (!server.registeredURLs) server.registeredURLs = [];
    if (!server.registeredURLs.includes(listener.url)) server.registeredURLs.push(listener.url);
    if (!listener.timeout) server.timeout = listener.timeout;   // override timeout, if provided, to the latest

    server.on("request", (req, res) => {
        if (res._esb_custom_sent_already) return;

        ASBLOG.info(`[HTTP_SERVER_FACTORY] Received new request from ${req.headers['x-forwarded-for']||req.socket.remoteAddress} for URL ${req.url}`);

        // catch 404s
        const baseurl = `${listener.isSecure?"https":"http"}://${listener.host}:${listener.port}`;
        const endPoint = new URL(req.url, baseurl).pathname;
        if (!server.registeredURLs.includes(endPoint)) {
            ASBLOG.error(`[HTTP_SERVER] Unregistered URL: ${req.url}, sending 404`);
            res.writeHead(404, {"Content-Type": "text/plain"});
            res.write("404 Not found.\n");
            res.end();
            res._esb_custom_sent_already = true;
        }
    });

    server.on("error", e => {
        ASBLOG.error("[HTTP_SERVER] FATAL: HTTP server issue");
        ASBLOG.error(`[HTTP_SERVER] FATAL: ${e}`);
        ASBLOG.error(`[HTTP_SERVER] FATAL: Stopping the flow ${listener.flow.flow.name}`, true);
        listener.flow.fatalError = true;    // stops the flow
        server.close();                     // stop the server
    });
}

function createSSLOptions(keyPath, certPath, callback) {
    fs.readFile(keyPath, (err, keydata) => {
        if (err) return callback(err);
        fs.readFile(certPath, (err, certdata) => {
            if (err) return callback(err);
            callback(null, { key: keydata, cert: certdata });
        });
    });
}