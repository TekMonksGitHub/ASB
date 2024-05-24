/* 
 * httpServerFactory.js, HTTP & HTTPS server factory
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const fs = require("fs");
const urlMod = require("url");
const http = require("http");
const https = require("https");
const ssl = require(CONSTANTS.CONFDIR+'/ssl.json');

exports.createHTTPSServer = listener => {
    ESB.env.HTTPSSERVERS = {};

    let host = listener.host || "::";  // support IPv6 for loopback
    let port = listener.port || 8080;  // default to port 8080   

    let server = ESB.env.HTTPSSERVERS[`${host}:${port}`];    // HTTPS servers must be ESB wide

    if (server) {
        initServer(server, listener);
        return server;  // server already listening
    }

    const httpsServerOptions = {
        key: fs.readFileSync(ssl.sslKeyFile),
        cert: fs.readFileSync(ssl.sslCertFile)
    }

    server = https.createServer(httpsServerOptions).listen(port, host);
    initServer(server, listener);
    ESB.env.HTTPSSERVERS[`${host}:${port}`] = server;

    LOG.info(`[SERVER_FACTORY] HTTPS server listening on ${host}:${port}`);

    return server;
}

exports.createHTTPServer = listener => {
    ESB.env.HTTPSERVERS = {};

    let host = listener.host || "::";  // support IPv6 for loopback
    let port = listener.port || 8080;  // default to port 8080   

    let server = ESB.env.HTTPSERVERS[`${host}:${port}`];    // HTTP servers must be ESB wide

    if (server) {
        initServer(server, listener);
        return server;  // server already listening
    }

    server = http.createServer().listen(port, host);
    initServer(server, listener);
    ESB.env.HTTPSERVERS[`${host}:${port}`] = server;

    LOG.info(`[SERVER_FACTORY] HTTP server listening on ${host}:${port}`);

    return server;
}

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
    if (!listener.timeout) server.timeout = listener.timeout;   // override timeout if provided to the latest

    const serverType = server instanceof http.Server? "HTTP" : "HTTPS";
    server.on("request", (req, res) => {
        if (res._esb_custom_sent_already) return;

        // catch 404s
        let endPoint = urlMod.parse(req.url, true).pathname;
        if (!server.registeredURLs.includes(endPoint)) {
            LOG.error(`[${serverType}_SERVER] Bad URL: ${req.url}, sending 404`);
            res.writeHead(404, {"Content-Type": "text/plain"});
            res.write("404 Not found.\n");
            res.end();
            res._esb_custom_sent_already = true;
        }
    });

    server.on("error", e => {
        LOG.error(`[${serverType}_SERVER] FATAL: ${serverType} server issue`);
        LOG.error(`[${serverType}_SERVER] FATAL: ${e}`);
        LOG.error(`[${serverType}_SERVER] FATAL: Stopping the flow ${listener.flow.flow.name}`, true);
        listener.flow.fatalError = true;    // stops the flow
        server.close();                     // stop the server
    });
}