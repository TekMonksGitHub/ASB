/* 
 * (C) 2015 TekMonks. All rights reserved.
 * License: MIT - see enclosed LICENSE file.
 */

const fs = require("fs");
const utils = require(`${CONSTANTS.LIBDIR}/utils.js`);
const log_conf = require(CONSTANTS.LOGSCONF);
let origLog;
let filewriter;

function initGlobalLogger(logName) {
	/* create the logger */
	if (!fs.existsSync(CONSTANTS.LOGDIR)) {fs.mkdirSync(CONSTANTS.LOGDIR);}
	filewriter = require(`${CONSTANTS.LIBDIR}/FileWriter.js`).createFileWriter(logName,log_conf.closeTimeOut,"utf8");
	
	global.LOG = new Logger(logName, log_conf.max_log_mb*1024*1024);	// 100 MB log max
	
	LOG.info("*************************************", true);
	LOG.info("*************************************", true);
	LOG.info("Logging subsystem initialized.", true);
}

exports.initGlobalLogger = initGlobalLogger;

Logger = function(path, maxsize) {
	this.path = path;
	this.maxsize = maxsize;
};

Logger.prototype.info = function(s, sync) {Logger.writeFile("info", this.path, s, sync);};

Logger.prototype.debug = function(s, sync) {if (log_conf.debug) Logger.writeFile("debug", this.path, s, sync);};

Logger.prototype.error = function(s, sync) {Logger.writeFile("error", this.path, s, sync);};

Logger.prototype.truncate = function(s) {return s.length > CONSTANTS.MAX_LOG ? s.substring(0, CONSTANTS.MAX_LOG) : s;}

Logger.prototype.overrideConsole = function() {
	origLog = global.console.log;
	global.console.log = function() {
		LOG.info("[console] " + require("util").format.apply(null, arguments)); 
	};
	process.stdout.write = function() {
		LOG.info("[stdout] " + require("util").format.apply(null, arguments));
	}
	process.stderr.write = function() {
		LOG.error("[stderr] " + require("util").format.apply(null, arguments));
	}
	process.on('uncaughtException', function(err) {
		LOG.error(err && err.stack ? err.stack : err, true);
		origLog("EXIT ON CRITICAL ERROR!!! Check Logs.");
		process.exit(1);
	});
};

Logger.prototype.getLogContents = function(callback) {
	fs.readFile(this.path, function(err, data){
		if (err) callback("Unable to read the log",null);
		else callback(null, data);
	});
};

Logger.writeFile = function(level, path, s, sync) {
	var msg = '{"ts":"'+utils.getDateTime()+'","level":"'+level+'","message":'+JSON.stringify(s)+'}\n';
	
	if (sync === undefined) {
		filewriter.writeFile(msg, err => {
			if (err) { 
				origLog("Logger error!");
				origLog(msg);
			}
		});
	} else {
		try {fs.appendFileSync(path, msg);}
		catch (err){
			origLog("Logger error!");
			origLog(msg);
		};
	}
};

