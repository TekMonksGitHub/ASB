/* 
 * sftpUpload.js - Upload files on sftp server 
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */
const Client = require('ssh2').Client;
const path = require('path');

exports.start =  (routeName, sftpUpload, _messageContainer, message) => {
    if (message.env[routeName] && message.env[routeName].isBeingProcessed) return; // already working on it.
    message.setGCEligible(false);

    if (sftpUpload.flow.env.isConnectionCreated == undefined) sftpUpload.flow.env.isConnectionCreated = true;
    else if (sftpUpload.flow.env.isConnectionCreated) return;

    if (!message.env[routeName]) message.env[routeName] = {}; message.env[routeName].isBeingProcessed = true;
   
    let sftpFlow =  () => {
        let localFilePath = `${path.basename(message.env.filepath).substring(0,path.basename(message.env.filepath).lastIndexOf('.'))}`;
        
        sftpUpload.flow.env.sftp.writeFile(`${sftpUpload.sftpFilePath}${localFilePath}`, message.content,   (err) => {
            if (err) {
                LOG.error(`[SFTP UPLOAD] Transfer Error : ${err}`);
                message.addRouteError(routeName);
                message.setGCEligible(true);
                message.addEmitGCListener(message.content.length);
                delete message.env[routeName].isBeingProcessed; // clean our garbage
                return;
            }
            message.addRouteDone(routeName);
            message.setGCEligible(true);
            message.addEmitGCListener(message.content.length);
            delete message.env[routeName].isBeingProcessed; // clean our garbage
        });
    }

    if (!sftpUpload.flow.env.connection) {
        sftpUpload.flow.env.connection = new Client();
        sftpUpload.flow.env.connection.on('ready', function () {
            LOG.info('Client :: ready');

            sftpUpload.flow.env.connection.sftp( function (err, sftp) {
                if (err) LOG.error(err);
                sftpUpload.flow.env.sftp = sftp;
                sftpUpload.flow.env.isConnectionCreated = false;
                sftpFlow();
            });
        }).on('error', function (err) {
            LOG.error(`[SFTP UPLOAD] ${err}`);
            sftpUpload.flow.env.connection = undefined;
            sftpUpload.flow.env.isConnectionCreated = undefined;
        }).connect({
            host: sftpUpload.host,
            port: sftpUpload.port,
            username: sftpUpload.username,
            password: sftpUpload.password
        });
    } else {
        sftpFlow();
    }
}
