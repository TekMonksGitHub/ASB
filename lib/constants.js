/* 
 * (C) 2018 TekMonks. All rights reserved.
 */

const path = require("path");
const rootdir = path.resolve(__dirname+"/../");

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
exports.LOGMAIN = rootdir+"/logs/asb.log.ndjson";

exports.MAX_LOG = 1024;

/* Encryption constants */
exports.CRPT_ALGO = "aes-256-ctr";
