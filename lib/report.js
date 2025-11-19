const fs = require('fs');
const path = require('path');

exports.initiateReport = function() {
    return new Promise((resolve, reject) => {
        const fileName = "test_report.json";
        const timestamp= Date.now();
        const reportsDir = path.join(ASBCONSTANTS.ROOTDIR, 'reports');
        const filePath = path.join(reportsDir, fileName);

        // Check if the reports directory exists, if not, create it
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        const reporttemplate = {
            results: {
                tool: {
                    name: "ASB Testing Tool"
                },
                summary: {
                    tests: 0,
                    passed: 0,
                    failed: 0,
                    pending: 0,
                    skipped: 0,
                    other: 0,
                    start: timestamp,
                    stop: "" // You can update this field when the tests are completed
                },
                tests: [],
                environment: {
                    appName: "ASB",
                    buildName: "YourBuild",
                    buildNumber: "0"
                }
            }
        };

        fs.writeFile(filePath, JSON.stringify(reporttemplate, null, 2), (err) => {
            if (err) {
                console.error('Error writing to file', err);
                reject(err);
            } else {
                console.log(`File ${fileName} has been written successfully`);
                resolve(fileName);
            }
        });
    });
};

exports.updateReport = function(reportName,filename,result,message,startTime,endTime){
	console.log(reportName);
	const filePath = path.join(ASBCONSTANTS.ROOTDIR, 'reports', reportName);
    
    // Read the existing report
    const data = fs.readFileSync(filePath, 'utf8')

        // Parse the JSON data
        let report;
        try {
            report = JSON.parse(data);
        } catch (parseErr) {
            console.error('Error parsing JSON', parseErr);
            return;
        }

        // Create a new test result object
        const testResult = {
            name: filename,
            status: result,
            duration: endTime-startTime,  // Example duration; you may want to calculate this dynamically
            start: startTime,
            end: endTime ,  // Example end time; adjust as necessary
            message: message,  // Example message
            filePath: `/tests/${filename}`
        };

        // Add the new test result to the tests array
        report.results.tests.push(testResult);

        // Update the summary
        report.results.summary.tests += 1;
        report.results.summary[result] += 1;
		report.results.summary['stop'] = Date.now();

        // Write the updated report back to the file
        fs.writeFile(filePath, JSON.stringify(report, null, 2), (writeErr) => {
            if (writeErr) {
                console.error('Error writing to file', writeErr);
            } else {
                console.log(`File ${reportName} has been updated successfully`);
            }
        });


}