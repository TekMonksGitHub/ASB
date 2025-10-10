/* 
 * asb.js, Main cluster manager for the ASB
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */
global.ASB_CONSTANTS = require(__dirname + "/lib/constants.js");

const cluster = require("cluster");

if (cluster.isMaster) {
	const conf = require(ASB_CONSTANTS.CONFDIR + "/cluster.json");

	// Figure out number of workers.
	let numWorkers = conf.workers;
	if (numWorkers == 0) {
		const numCPUs = require("os").cpus().length;
		if (numCPUs < conf.min_workers) numWorkers = conf.min_workers;
		else numWorkers = numCPUs;
	}

	// Fork workers.
	console.log("Starting " + numWorkers + " workers.");
	for (let i = 0; i < numWorkers; i++) cluster.fork();

	cluster.on("exit", (server, _code, _signal) => {
		console.log("Worker server with PID: " + server.process.pid + " died.");
		console.log("Forking a new process to compensate.");
		cluster.fork();
	});
} else require(ASB_CONSTANTS.LIBDIR + "/main.js").bootstrap();
