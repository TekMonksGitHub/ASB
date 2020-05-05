/* 
 * sftp.js - Download files from SFTP server
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const sftpDownload = require(`${CONSTANTS.ROOTDIR}/lib/sftpDownload.js`);

exports.start = (routeName, sftp, messageContainer, message) => {
    sftpDownload.start(routeName, sftp, messageContainer, message);
}