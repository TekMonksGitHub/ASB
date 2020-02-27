/* 
 * csvparser.js, CSV reader - To convert CSV to JSON messages
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const papa = require("papaparse"); 

exports.start = (routeName, csvparser, _messageContainer, message) => {
    LOG.debug("[CSVPARSER] Called for CSV message: "+message.content);

    let results = null;
    let exception = null; try{results = papa.parse(message.content);} catch(e){exception=e;}
    if (exception || (results && results.errors && results.errors.length)) {
        let err = (exception ? exception: (results?results.errors.join(","):"Unknown error") );
        LOG.error(`[CSVPARSER] Failed to parse incoming message: ${err}`);
        LOG.error(`[CSVPARSER] Error message was: ${message.content}`);
        message.addRouteError(routeName);
        return;
    }

    const values = results.data[0];

    if (values.length != csvparser.csv_headers.length) {
        LOG.error("[CSVPARSER] Bad CSV, values don't match headers provided. Length mismatch.");
        message.addRouteError(routeName);
        return;
    }

    let jsonObj = {};
    csvparser.csv_headers.forEach((header, index) => {jsonObj[header] = csvparser.trimValues?values[index].trim():values[index];});

    message.content = jsonObj;
    message.addRouteDone(routeName);
}