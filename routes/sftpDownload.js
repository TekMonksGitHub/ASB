/* 
 * sftpClient.js - Download files from sftp server 
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */
const Client = require('ssh2').Client;
const fs = require('fs');

exports.start = (routeName, sftpClient, messageContainer, message) => {
    let connection = new Client();

    connection.on('ready', function () {
        LOG.info('Client :: ready');

        connection.sftp(function (err, sftp) {
            if (err) LOG.error(err);
            sftp.readdir(`${sftpClient.sftpFilePath}${sftpClient.sftpInitialPath}`, function (err, filelist) {
                if (err) LOG.error(err);
                let totalfiles = filelist.length;

                filelist.forEach(fileStat => {
                    let sftpFileDownloadPath = `${sftpClient.sftpFilePath}${sftpClient.sftpProcessingPath}${fileStat.filename}.downloading`;
                    let asbFilePath = `${sftpClient.asbDownloadPath}${fileStat.filename}.downloading`;

                    sftpRenameFile(sftp,`${sftpClient.sftpFilePath}${sftpClient.sftpInitialPath}/${fileStat.filename}`, `${sftpClient.sftpFilePath}${sftpClient.sftpProcessingPath}${fileStat.filename}.downloading`, function (err) {
                        if (err) LOG.error(`Error on downloading file from sftp server: ${err}`);
                        else LOG.info(`Downloading started ${sftpFileDownloadPath}`);
                    });
                    
                    sftp.fastGet(sftpFileDownloadPath, asbFilePath, (err) => {
                        if (err) LOG.error(`Error on downloading file from sftp server: ${err}`);
                        let newPath = asbFilePath.substring(0, asbFilePath.indexOf('.downloading'));
                        fs.rename(asbFilePath, newPath, (err) => {
                            if (err) LOG.error(`Error on downloading file from sftp server: ${err}`);
                            sftpRenameFile(sftp,`${sftpClient.sftpFilePath}${sftpClient.sftpProcessingPath}${fileStat.filename}.downloading`, `${sftpClient.sftpFilePath}${sftpClient.sftpDonePath}${fileStat.filename}`, function (err) {
                                if (err) LOG.error(`Error when renaming file: ${err}`);
                                else LOG.info(`Download completed ${fileStat.filename}`);

                                totalfiles--;
                                if (totalfiles <= 0) { message.addRouteDone(routeName); connection.end(); }
                            });
                        });
                    });
                });
            });
        });
    }).connect({
        host: sftpClient.host,
        port: sftpClient.port,
        username: sftpClient.username,
        password: sftpClient.password
    });
}

let sftpRenameFile = (sftp, oldName, newName, cb) => {
    sftp.rename(oldName, newName, cb);
}