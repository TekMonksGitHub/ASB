/* 
 * (C) 2015 TekMonks. All rights reserved.
 * License: MIT - see enclosed LICENSE file.
 */

const fs = require("fs");
const utils = require(`${ASBCONSTANTS.LIBDIR}/utils.js`);
const log_conf = require(ASBCONSTANTS.LOGSCONF);
let origLog;

function initGlobalLoggerSync(logName) {
	/* create the logger */
	if (!fs.existsSync(ASBCONSTANTS.LOGDIR)) fs.mkdirSync(ASBCONSTANTS.LOGDIR);
	let filewriter = 
		require(`${ASBCONSTANTS.LIBDIR}/FileWriter.js`).createFileWriter(logName,log_conf.closeTimeOut,"utf8");
	
	global.ASBLOG = new Logger(logName, log_conf.max_log_mb*1024*1024, filewriter);	// 100 MB log max
	
	ASBLOG.info("*************************************", true);
	ASBLOG.info("*************************************", true);
	ASBLOG.info("Logging subsystem initialized.", true);
}

exports.initGlobalLoggerSync = initGlobalLoggerSync;

Logger = function(path, maxsize, filewriter) {
	this.path = path;
	this.maxsize = maxsize;
	this.filewriter = filewriter;
};

Logger.prototype.info = function(s, sync) {this.writeFile("info", s, sync);}

Logger.prototype.debug = function(s, sync) {if (log_conf.debug) this.writeFile("debug", s, sync);}

Logger.prototype.error = function(s, sync) {this.writeFile("error", s, sync);}

Logger.prototype.truncate = function(s) {return s.length > ASBCONSTANTS.MAX_LOG ? s.substring(0, ASBCONSTANTS.MAX_LOG) : s;}

Logger.prototype.console = function(s) {
	if (this.origLog) this.origLog(s?s.trim():s);	// send to console or debug console, trimmed
	process.stdout.call(process.stdout, s);			// send to process' STDOUT
}

Logger.prototype.overrideConsole = function() {
	origLog = global.console.log;
	global.console.log = function() {
		ASBLOG.info("[console] " + require("util").format.apply(null, arguments)); 
	};
	process.stdout.write = function() {
		ASBLOG.info("[stdout] " + require("util").format.apply(null, arguments));
	}
	process.stderr.write = function() {
		ASBLOG.error("[stderr] " + require("util").format.apply(null, arguments));
	}
	process.on('uncaughtException', function(err) {
		ASBLOG.error(err && err.stack ? err.stack : err, true);
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

Logger.prototype.writeFile = function(level, s, sync) {
	let msg = '{"ts":"'+utils.getDateTime()+'","level":"'+level+'","message":'+JSON.stringify(s)+'}\n';
	
	if (sync === undefined) {
		this.filewriter.writeFile(msg, err => {
			if (err) { 
				this.origLog("Logger error!");
				this.origLog(msg);
				process.stdout.write.call(process.stderr, "Logger error!\n");
				process.stdout.call(process.stderr, msg);
			}
		});
	} else {
		try {fs.appendFileSync(this.path, msg);}
		catch (err){
			(this.origLog||console.log)("Logger error!");
			(this.origLog||console.log)(msg);
			process.stderr.write.call(process.stderr, "Logger error!\n");
			process.stderr.write.call(process.stderr, msg);
		};
	}
};
