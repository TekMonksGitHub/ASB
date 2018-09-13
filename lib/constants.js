/* 
 * (C) 2018 TekMonks. All rights reserved.
 */

var path = require("path");
var rootdir = path.resolve(__dirname+"/../");

exports.ROOTDIR = rootdir;
exports.LIBDIR = path.normalize(rootdir+"/lib");
exports.CONFDIR = path.normalize(rootdir+"/conf");
exports.LOGDIR = path.normalize(rootdir+"/logs");
exports.FLOWSDIR = path.normalize(rootdir+"/flows");
exports.LISTENERSDIR = path.normalize(rootdir+"/listeners");

exports.ESBCONF = rootdir+"/conf/esb.json";
exports.LOGSCONF = rootdir+"/conf/log.json";
exports.CLUSTERCONF = rootdir+"/conf/cluster.json";
exports.CRYPTCONF = rootdir+"/conf/crypt.json";
exports.LOGMAIN = rootdir+"/logs/server.log.json";
exports.ACCESSLOG_MIRROR = rootdir+"/logs/mirror.log.json";

exports.MAX_LOG = 1024;

/* Encryption constants */
exports.CRPT_ALGO = "aes-256-ctr";

/* Message constants */
exports.MSGCONSTANTS = {};
exports.MSGCONSTANTS.DEPENDENCIES = "dependencies";
exports.MSGCONSTANTS.DEPENDENCIES_DONE = "routesDone";
exports.MSGCONSTANTS.TIMESTAMP = "timestamp";
exports.MSGCONSTANTS.FILEPATH = "path";

