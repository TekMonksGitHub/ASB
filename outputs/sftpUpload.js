/* 
 * sftpUpload.js - Upload a message as a file on SFTP server
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const sftpUpload_real = require(`${CONSTANTS.ROOTDIR}/routes/sftpUpload.js`);

exports.start = (routeName, sftpUpload, messageContainer, message) => {
    sftpUpload_real.start(routeName, sftpUpload, messageContainer, message);
}