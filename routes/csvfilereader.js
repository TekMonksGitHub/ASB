/* 
 * csvreader.js, CSV reader - To convert CSV file to JSON messages
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const fs = require("fs");

exports.start = (routeName, listener, messageContainer, message) => {
    LOG.info(`[CSVFILEREADER] Processing CSV file: ${message[CONSTANTS.MSGCONSTANTS.FILEPATH]}`);
}