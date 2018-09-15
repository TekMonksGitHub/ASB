/* 
 * httpServerFactory.js, HTTP server factory
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const http = require("http");
const urlMod = require("url");
ESB.HTTPSERVERS = {};

exports.createHTTPServer = listener => {
    let host = listener.host ? listener.host:"::";  // support IPv6 for loopback
    let port = listener.port ? listener.port:8080;  // default to port 8080   

    let server = ESB.HTTPSERVERS[`${host}:${port}`];

    if (server) {
        initServer(server, listener);
        return server;  // server already listening
    }

    server = http.createServer().listen(port, host);
    initServer(server, listener);
    ESB.HTTPSERVERS[`${host}:${port}`] = server;

    return server;
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