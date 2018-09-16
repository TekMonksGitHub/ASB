/* 
 * (C) 2018 TekMonks. All rights reserved.
 * 
 * callback format -> callback(error, data)
 */

const http = require("http");
const https = require("https");

const querystring = require("querystring");

function post(host, port, path, req, headers, callback) {
    headers["Content-Length"] = Buffer.byteLength(req, "utf8");
    
    var optionspost = {
        host : host,
        port : port,
        path : path,
        method : "POST",
        headers : postheaders
    };

    doCall(req, optionspost, false, callback);
}

function postHttps(host, port, path, req, callback) {
    headers["Content-Length"] = Buffer.byteLength(req, "utf8");
    
    var optionspost = {
        host : host,
        port : port,
        path : path,
        method : 'POST',
        headers : postheaders
    };

    doCall(req, optionspost, true, callback);
}

function put(host, port, path, req, callback) {
    headers["Content-Length"] = Buffer.byteLength(req, "utf8");
    
    var optionsput = {
        host : host,
        port : port,
        path : path,
        method : 'PUT',
        headers : putheaders
    };

    doCall(req, optionsput, false, callback);
}

function putHttps(host, port, path, req, callback) {
    headers["Content-Length"] = Buffer.byteLength(req, "utf8");
    
    var optionsput = {
        host : host,
        port : port,
        path : path,
        method : 'PUT',
        headers : putheaders
    };

    doCall(req, optionsput, true, callback);
}

function get(host, port, path, req, callback) {
    if (req) path += "?" + querystring.stringify(req);

    var optionsget = {
        host : host,
        port : port,
        path : path,
        method : 'GET',
        headers : {}
    };

    doCall(null, optionsget, false, callback);
}

function getHttps(host, port, path, req, callback) {
    if (req) path += "?" + querystring.stringify(req);

    var optionsget = {
        host : host,
        port : port,
        path : path,
        method : 'GET',
        headers : {}
    };

    doCall(null, optionsget, true, callback);
}

function deleteHttp(host, port, path, _req, callback) {
    var optionsdelete = {
        host : host,
        port : port,
        path : path,
        method : 'DELETE',
        headers : {}
    };

    doCall(null, optionsdelete, false, callback);
}

function deleteHttps(host, port, path, _req, callback) {

    var optionsdelete = {
        host : host,
        port : port,
        path : path,
        method : 'GET',
        headers : {}
    };

    doCall(null, optionsdelete, true, callback);
}

function doCall(reqStr, options, secure, callback) {
    var caller = secure ? https : http;
    var responseString = "";
    var req = caller.request(options, (res) => {
        res.on("data", (d) => {responseString += d});

        res.on("end", function() {
            let status = this.statusCode;
            callback(null, responseString, status);
        });
    });
 
    if (reqStr) req.write(reqStr);
    req.end();
    req.on("error", (e) => {callback(e, null)})
}

if (require.main === module) {
	var args = process.argv.slice(2);
	
    if (args.length == 0) console.log("Usage: httpclient <host> <port> <path> <data>");
    else post(args[0], args[1], args[2], args[3], (e, data) => { 
        if (!e) console.log(JSON.stringify(data)); else console.log(e); 
    });
}

exports.get = get;
exports.post = post;
exports.put = put;
exports.delete = deleteHttp;

exports.getHttps = getHttps;
exports.postHttps = postHttps;
exports.putHttps = putHttps;
exports.deleteHttps = deleteHttps;