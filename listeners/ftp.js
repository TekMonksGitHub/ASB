/* 
 * ftp.js - Download FTP files from FTP server
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const ftpDownload = require(`${CONSTANTS.ROOTDIR}/lib/ftpDownload.js`);

exports.start = (routeName, ftp, messageContainer, message) => {
    ftpDownload.start(routeName, ftp, messageContainer, message);
}