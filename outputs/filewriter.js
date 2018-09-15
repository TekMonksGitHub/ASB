/* 
 * filewriter.js - Write message contents to a file
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const filewriter_real = require(`${CONSTANTS.ROOTDIR}/routes/filewriter.js`);

exports.start = (routeName, filewriter, _messageContainer, message) => {
    filewriter_real.start(routeName, filewriter, _messageContainer, message);
}