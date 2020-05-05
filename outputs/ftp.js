/* 
 * ftp.js - Upload files on FTP server
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const ftpUpload = require(`${CONSTANTS.ROOTDIR}/lib/ftpUpload.js`);

exports.start = (routeName, ftp, messageContainer, message) => {
    ftpUpload.start(routeName, ftp, messageContainer, message);
}