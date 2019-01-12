/* 
 * (C) 2018 TekMonks. All rights reserved.
 * 
 * callback format -> callback(error, data)
 */

const http = require("http");
const https = require("https");

const querystring = require("querystring");

function post(host, port, path, headers, req, timeout = 120000, callback) {
    if (req) req = (typeof (req) == "object" ? querystring.stringify(req):req);
    headers["Content-Length"] = Buffer.byteLength(req, "utf8");
    
    let optionspost = {
        host : host,
        port : port,
        path : path,
        method : "POST",
        headers : headers,
        timeout: timeout
    };

    doCall(req, optionspost, false, callback);
}

function postHttps(host, port, path, headers, req, timeout = 120000, callback) {
    if (req) req = (typeof (req) == "object" ? querystring.stringify(req):req);
    headers["Content-Length"] = Buffer.byteLength(req, "utf8");
    
    let optionspost = {
        host : host,
        port : port,
        path : path,
        method : 'POST',
        headers : headers,
        timeout: timeout
    };

    doCall(req, optionspost, true, callback);
}

function put(host, port, path, headers, req, timeout = 120000, callback) {
    if (req) req = (typeof (req) == "object" ? querystring.stringify(req):req);
    headers["Content-Length"] = Buffer.byteLength(req, "utf8");
    
    let optionsput = {
        host : host,
        port : port,
        path : path,
        method : 'PUT',
        headers : headers,
        timeout: timeout
    };

    doCall(req, optionsput, false, callback);
}

function putHttps(host, port, path, headers, req, timeout = 120000, callback) {
    if (req) req = (typeof (req) == "object" ? querystring.stringify(req):req);
    headers["Content-Length"] = Buffer.byteLength(req, "utf8");
    
    let optionsput = {
        host : host,
        port : port,
        path : path,
        method : 'PUT',
        headers : headers,
        timeout: timeout
    };

    doCall(req, optionsput, true, callback);
}

function get(host, port, path, headers, req, timeout = 120000, callback) {
    if (req) path += "?" + (typeof (req) == "object" ? querystring.stringify(req):req);

    let optionsget = {
        host : host,
        port : port,
        path : path,
        method : 'GET',
        headers : headers,
        timeout: timeout
    };

    doCall(null, optionsget, false, callback);
}

function getHttps(host, port, path, headers, req, timeout = 120000, callback) {
    if (req) path += "?" + (typeof (req) == "object" ? querystring.stringify(req):req);

    let optionsget = {
        host : host,
        port : port,
        path : path,
        method : 'GET',
        headers : headers,
        timeout: timeout
    };

    doCall(null, optionsget, true, callback);
}

function deleteHttp(host, port, path, headers, req, timeout = 120000, callback) {
    if (req) path += "?" + (typeof (req) == "object" ? querystring.stringify(req):req);

    let optionsdelete = {
        host : host,
        port : port,
        path : path,
        method : 'DELETE',
        headers : headers,
        timeout: timeout
    };

    doCall(null, optionsdelete, false, callback);
}

function deleteHttps(host, port, path, headers, req, timeout = 120000, callback) {
    if (req) path += "?" + (typeof (req) == "object" ? querystring.stringify(req):req);

    let optionsdelete = {
        host : host,
        port : port,
        path : path,
        method : 'GET',
        headers : headers,
        timeout: timeout
    };

    doCall(null, optionsdelete, true, callback);
}

function doCall(reqStr, options, secure, callback) {
    let caller = secure ? https : http;
    let response = "";
    let req = caller.request(options, res => {
        res.on("data", d => response += d);

        res.on("end", function() {
            let status = this.statusCode;
            callback(null, {response, status});
        });
    });
 
    if (reqStr) req.write(reqStr);
    req.end();
    req.on("error", (e) => {callback(e, null)})
}

if (require.main === module) {
	let args = process.argv.slice(2);
	
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