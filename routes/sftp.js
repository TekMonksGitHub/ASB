/* 
 * sftp.js - Download files from SFTP server
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const sftpDownload = require(`${CONSTANTS.ROOTDIR}/lib/sftpDownload.js`);
const sftpUpload = require(`${CONSTANTS.ROOTDIR}/lib/sftpUpload.js`);

exports.start = (routeName, sftp, messageContainer, message) => {
    if(sftp.task.toLowerCase() == "download") sftpDownload.start(routeName, sftp, messageContainer, message);
    else if(sftp.task.toLowerCase() == "upload") sftpUpload.start(routeName, sftp, messageContainer, message);
    else LOG.error(`[SFTP Routes] Please choose task field as download or upload`);
}