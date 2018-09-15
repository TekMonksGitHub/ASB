/* 
 * httpServerFactory.js, HTTP server factory
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const http = require("http");
const urlMod = require("url");
ESB.env.HTTPSERVERS = {};

exports.createHTTPServer = listener => {
    let host = listener.host ? listener.host:"::";  // support IPv6 for loopback
    let port = listener.port ? listener.port:8080;  // default to port 8080   

    let server = ESB.env.HTTPSERVERS[`${host}:${port}`];    // HTTP servers must be ESB wide

    if (server) {
        initServer(server, listener);
        return server;  // server already listening
    }

    server = http.createServer().listen(port, host);
    initServer(server, listener);
    ESB.env.HTTPSERVERS[`${host}:${port}`] = server;

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

function initServer(server, listener) {
    if (!server.registeredURLs) server.registeredURLs = [];
    if (!server.registeredURLs.includes(listener.url)) server.registeredURLs.push(listener.url);
    if (!listener.timeout) server.timeout = listener.timeout;   // override timeout if provided to the latest

    server.on("request", (req, res) => {
        if (res._esb_custom_sent_already) return;

        // catch 404s
        let endPoint = urlMod.parse(req.url, true).pathname;
        if (!server.registeredURLs.includes(endPoint)) {
            LOG.error(`[HTTP_SERVER] Bad URL: ${req.url}, sending 404`);
            res.writeHead(404, {"Content-Type": "text/plain"});
            res.write("404 Not found.\n");
            res.end();
            res._esb_custom_sent_already = true;
        }
    });

    server.on("error", e => {
        LOG.error("[HTTP_SERVER] FATAL: HTTP server issue");
        LOG.error(`[HTTP_SERVER] FATAL: ${e}`);
        LOG.error(`[HTTP_SERVER] FATAL: Stopping the flow ${listener.flow.flow.name}`, true);
        listener.flow.fatalError = true;    // stops the flow
        server.close();                     // stop the server
    });
}