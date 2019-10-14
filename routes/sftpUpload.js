/* 
 * sftpUpload.js - Upload a message as a file on SFTP server 
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */
const Client = require('ssh2').Client;
const path = require('path');
const fs = require('fs');

exports.start = (routeName, sftpUpload, messageContainer, message) => {
    let connection = new Client();
    let localFilePath = `${path.basename(message.env.filepath).substring(0,path.basename(message.env.filepath).lastIndexOf('.'))}`;
    fs.writeFile(`${sftpUpload.localPath}/${localFilePath}`, message.content, (err) => {
        if (err) { LOG.error(`[SFTP UPLOAD] Local File Creation Error : ${err}`); return; }
        LOG.info(`[SFTP UPLOAD] File created on LOCAL server.`);
        
        connection.on('ready', function () {
        LOG.info('Client :: ready');
        
        connection.sftp(function (err, sftp) {
            if (err) LOG.error(err);
            sftp.fastPut(`${sftpUpload.localPath}/${localFilePath}`, `${sftpUpload.sftpFilePath}/${localFilePath}`, (err)=>{
                if (err) { LOG.error(`[SFTP UPLOAD] Transfer Error : ${err}`); return; }
                fs.unlink(`${sftpUpload.localPath}/${localFilePath}`, (err) => {
                    if (err) { LOG.info(`[SFTP UPLOAD] Delete Error : ${err}`); return; }
                    LOG.info(`[SFTP UPLOAD] Successfully deleted local file`);
                    message.addRouteDone(routeName);
                });
            });
        });
        }).connect({
            host: sftpUpload.host,
            port: sftpUpload.port,
            username: sftpUpload.username,
            password: sftpUpload.password
        });
    });
}