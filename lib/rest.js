/* 
 * (C) 2018 TekMonks. All rights reserved.
 */

const http = require("http");
const https = require("https");

const querystring = require("querystring");

function post(host, port, path, req, callback) {
    var jsonStr = JSON.stringify(req);

    var postheaders = {
        "Content-Type" : "application/json",
        "Content-Length" : Buffer.byteLength(jsonStr, "utf8")
    };
    
    var optionspost = {
        host : host,
        port : port,
        path : path,
        method : 'POST',
        headers : postheaders
    };

    doCall(jsonStr, optionspost, false, callback);
}

function postHttps(host, port, path, req, callback) {
    var jsonStr = JSON.stringify(req);

    var postheaders = {
        "Content-Type" : "application/json",
        "Content-Length" : Buffer.byteLength(jsonStr, "utf8")
    };
    
    var optionspost = {
        host : host,
        port : port,
        path : path,
        method : 'POST',
        headers : postheaders
    };

    doCall(jsonStr, optionspost, true, callback);
}

function put(host, port, path, req, callback) {
    var jsonStr = JSON.stringify(req);

    var putheaders = {
        "Content-Type" : "application/json",
        "Content-Length" : Buffer.byteLength(jsonStr, "utf8")
    };
    
    var optionsput = {
        host : host,
        port : port,
        path : path,
        method : 'PUT',
        headers : putheaders
    };

    doCall(jsonStr, optionsput, false, callback);
}

function putHttps(host, port, path, req, callback) {
    var jsonStr = JSON.stringify(req);

    var putheaders = {
        "Content-Type" : "application/json",
        "Content-Length" : Buffer.byteLength(jsonStr, "utf8")
    };
    
    var optionsput = {
        host : host,
        port : port,
        path : path,
        method : 'PUT',
        headers : putheaders
    };

    doCall(jsonStr, optionsput, true, callback);
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

function deleteHttp(host, port, path, callback) {
    var optionsdelete = {
        host : host,
        port : port,
        path : path,
        method : 'DELETE',
        headers : {}
    };

    doCall(null, optionsdelete, false, callback);
}

function deleteHttps(host, port, path, callback) {

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
            callback(null, JSON.parse(responseString), status);
        });
    });
 
    if (reqStr) req.write(reqStr);
    req.end();
    req.on("error", (e) => {callback(e, null)})
}

if (require.main === module) {
	var args = process.argv.slice(2);
	
    if (args.length == 0) console.log("Usage: rest <host> <port> <path> <json>");
    else post(args[0], args[1], args[2], JSON.parse(args[3]), (e, data) => { 
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