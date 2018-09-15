/* 
 * csvwriter.js - Convert JSON to CSV and write to a file
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const csvwriter = require(`${CONSTANTS.ROOTDIR}/routes/csvwriter.js`);

exports.start = (routeName, csvwriter, _messageContainer, message) => {
    csvwriter.start(routeName, csvwriter, _messageContainer, message);
}