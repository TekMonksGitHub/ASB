const fs = require('fs');
const csv = require('csvtojson');
const path=require("path")

exports.runTestsAsync = async function (argv) {
    if ((argv[0]) && (argv[0].toLowerCase() != "csvtojson")) {
        ASBLOG.info("Skipping csvtojson flow, not called.\n")
        return 'skipped';
    }
    try {
        let result;
        let output = await createAndMoveFile();
        if (output === true) {
            result = true;
            ASBLOG.info("JSON file created and content matches.");
        } else if (output === false) {
            result = {}
            result.message = "JSON file created but content does not match.";
        } else {
            result = {}
            ASBLOG.info({ result: false, err: "[test_CSVtojson] error in that flow.", error: result });
            result.message = output.message;
        }
        return result;
    } catch (err) {
        ASBLOG.info({ result: false, err: "[test_CSVtojson] error in that flow.", error: err });
        return err;
    }
}
async function createAndMoveFile() {
    try {
        const csvContent = `Date;Open;High;Low;Close;Adj Close;Volume
12;yes;11;3;12;11;77`;
        const csvFilePath = `${CONSTANTS.ROOTDIR}/test.csv`;
        const newCsvFilePath = `${CONSTANTS.ROOTDIR}/testing/in/test.csv`;
        const jsonFilePath = `${CONSTANTS.ROOTDIR}/VOO.ndjson`;
        fs.writeFileSync(csvFilePath, csvContent);
        fs.mkdirSync(path.dirname(newCsvFilePath), { recursive: true });    
        fs.renameSync(csvFilePath, newCsvFilePath);              
        await new Promise(resolve => setTimeout(resolve, 5000));            
        try {
            fs.accessSync(jsonFilePath);
            const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');   
            const jsonData = jsonContent.trim().split('\n').map(line => JSON.parse(line));
            const expectedJsonData = await csv({ delimiter: ';' }).fromString(csvContent);   
            const isDataMatching = JSON.stringify(jsonData) === JSON.stringify(expectedJsonData);
            if (isDataMatching) {
                ASBLOG.info('[test_CSVtojson] JSON file content matches the CSV content.');
                return true;
            } else {
                ASBLOG.info('[test_CSVtojson] JSON file content does not match the CSV content.');
                return false;
            }
        } catch (err) {
            ASBLOG.info('[test_CSVtojson] JSON file does not exist:', err);
            return err;
        }
    } catch (err) {
        ASBLOG.info('Error:', err);
        return err;
    }
}