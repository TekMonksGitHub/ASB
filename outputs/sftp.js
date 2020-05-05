/* 
 * sftp.js - Upload files on sFTP server
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const sftpUpload = require(`${CONSTANTS.ROOTDIR}/lib/sftpUpload.js`);

exports.start = (routeName, sftp, messageContainer, message) => {
    sftpUpload.start(routeName, sftp, messageContainer, message);
}