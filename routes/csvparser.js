/* 
 * csvparser.js, CSV reader - To convert CSV to JSON messages
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const Papa = require("papaparse"); 

exports.start = (routeName, csvparser, messageContainer, message) => {
    message.addRouteDone(routeName);
    LOG.debug("[CSVPARSER] Called for CSV message: "+message.content.csv);

    let results = Papa.parse(message.content.csv);
    if (results.errors && results.errors.length) {
        LOG.error(`[CSVPARSER] Failed to parse incoming message: ${results.errors.join(",")}`);
        LOG.error(`[CSVPARSER] Error message was: ${message.content.csv}`);
        message.addRouteDone(`${routeName}.error`);
        return;
    }

    let values = results.data[0];
    let jsonObj = {};
    csvparser.csv_headers.forEach((header, index) => {jsonObj[header] = csvparser.trimValues?values[index].trim():values[index];});

    let messageOut = MESSAGE_FACTORY.newMessage();
    messageOut.content = jsonObj;
    messageOut.addRouteDone(routeName);
    messageContainer.add(messageOut);
}