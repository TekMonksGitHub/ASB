/**
 * Runs embedded app's test cases.
 * 
 * (C) 2023 Tekmonks. All rights reserved.
 */

const fs = require("fs");
const path = require("path");
const { spawn } = require('child_process');
global.CONSTANTS = require(__dirname + "/lib/constants.js");
const { initiateReport, updateReport } = require(`${ASBCONSTANTS.LIBDIR}/report`);


let asbProcess; 
let testResult;
async function runTestsAsync(argv, report) {
	const testCasesDir = path.resolve(argv[0]);
	const allfiles = fs.readdirSync(testCasesDir);
	for (const fileEntry of allfiles) if (fileEntry.toLowerCase().startsWith("test") &&
		fileEntry.toLowerCase().endsWith(".js") && (fileEntry != path.basename(__filename))) {

		const testModule = require(`${testCasesDir}/${fileEntry}`);
		if (testModule.runTestsAsync)
			try {
				let resultLog;
				let result;
				let startTime = Date.now();
					testResult = await testModule.runTestsAsync(argv.slice(1));
					if (testResult == 'skipped') {
						resultLog = `Testcase ${fileEntry} skipped.\n\n`;
						result = 'skipped';
						message = 'skipped'
					}
					else if (testResult === true) {
						resultLog = `Testcase ${fileEntry} succeeded.\n\n`;
						result = 'passed';
						message = 'success'
					}
					else {
						resultLog = `Testcase ${fileEntry} failed with error false\n\n`;
						result = 'failed';
						message = testResult.message;
					}
					LOG[testResult ? "info" : "error"](resultLog);
					updateReport(report, fileEntry, result, message, startTime, Date.now());
				
			} catch (err) {
				const error = `Testcase ${fileEntry} failed with error ${err}\n\n`;
				ASBLOG.error(error);
				ASBLOG.info(error);
			}
		else {
			const errorMsg = `Skipping ${fileEntry} as it is not a proper test case module.\n\n`;
			ASBLOG.warn(errorMsg); ASBLOG.info(errorMsg);
		}
	}
}
function setupServerEnvironmentForTesting() {
	const conf = require(`${ASBCONSTANTS.CONFDIR}/server.json`);
	/* Init - Server bootup */
	console.log("creating server for testing ..");
	/* Init the logs */
	console.log("Initializing the logs.");
	require(ASBCONSTANTS.LIBDIR + "/ASBLOG.js").initGlobalLoggerSync(`${ASBCONSTANTS.LOGDIR}/${conf.logfile}`);
	ASBLOG.overrideConsole();
	/* Warn if in debug mode */
	if (conf.debug_mode) {
		ASBLOG.info("**** Server is in debug mode, expect severe performance degradation.\n");
	}
	asbProcess = spawn('node', [ASBCONSTANTS.ROOTDIR + "/asb.js"], {
		stdio: ['inherit']  // This will capture the stdout and stderr
	});
	return new Promise((resolve, reject) => {
		asbProcess.on('error', (err) => {
			ASBLOG.error(`Failed to start server: ${err}`);
			reject(err);
		});
		asbProcess.on('exit', (code) => {
			if (code !== 0) {
				reject(new Error(`Server process exited with code ${code}`));
			}
		});
		asbProcess.stdout.on('data', (data) => {
			const message = data.toString();
			ASBLOG.info(`stdout: ${message}`);
			if (message.includes('Running...')) { // Adjust this condition based on the actual readiness message
				resolve();
			}
			if (message.includes('Error')) {
				asbProcess.kill('SIGTERM');
				testResult = message;
				reject();
			}
		});
	});
}
async function main(argv) {
	if (!argv[0]) {
		console.error(`Usage: ${__filename} [app tests folder path] [...other params]`);
		process.exit(1);
	}
	try {
		await setupServerEnvironmentForTesting();   // init the server environment only when it's ready
		let report = await initiateReport();
		await runTestsAsync(argv, report); // run the tests
	} catch (error) {
		ASBLOG.error(`Error during setup or testing: ${error.message}`);
		process.exit(1);
	}
	shouldExit = true; // exit
}
const exit = _ => {
	if (asbProcess) {
		asbProcess.on('exit', () => process.exit(0));  // Exit the parent process when the child exits
		asbProcess.kill('SIGTERM'); // Send SIGTERM to allow the child process to clean up
	} else {
		process.exit(0); // Exit immediately if there's no child process
	}
}
let shouldExit = false;
if (require.main === module) {
	main(process.argv.slice(2)); setInterval(_ => {
		if (shouldExit)
			exit();
	}, 100);
}