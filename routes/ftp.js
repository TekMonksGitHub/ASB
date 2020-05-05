/* 
 * ftp.js - Download and Upload files from FTP server
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const ftpDownload = require(`${CONSTANTS.ROOTDIR}/lib/ftpDownload.js`);
const ftpUpload = require(`${CONSTANTS.ROOTDIR}/lib/ftpUpload.js`);

exports.start = (routeName, ftp, messageContainer, message) => {
    if(ftp.task.toLowerCase() == "download") ftpDownload.start(routeName, ftp, messageContainer, message);
    else if(ftp.task.toLowerCase() == "upload") ftpUpload.start(routeName, ftp, messageContainer, message);
    else LOG.error(`[FTP Routes] Please choose task field as download or upload`);
}