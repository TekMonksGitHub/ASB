/* 
 * csvwriter.js - Convert JSON to CSV and write to a file
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const csvwriter_real = require(`${CONSTANTS.ROOTDIR}/routes/csvwriter.js`);

exports.start = (routeName, csvwriter, messageContainer, message) => {
    csvwriter_real.start(routeName, csvwriter, messageContainer, message);
}