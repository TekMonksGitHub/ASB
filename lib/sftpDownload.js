/* 
 * sftpDownload.js - Download files from sftp server 
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */
const Client = require('ssh2').Client;
const fs = require('fs');
var rename = require('util').promisify(fs.rename);
const path = require('path');

exports.start = (routeName, sftpDownload, messageContainer, message) => {
    if (sftpDownload.flow.env[routeName] && sftpDownload.flow.env[routeName].busy) return; // we are busy processing
    sftpDownload.flow.env[routeName] = { "busy": true };
    let connection = new Client();

    connection.on('ready', function () {
            LOG.info('Client :: ready');

            connection.sftp(function (err, sftp) {
                if (err) {
                    LOG.error(`[SFTP DOWNLOAD] sFTP Connection Error ${err}`);

                    sftpDownload.flow.env[routeName] = {"busy": false};
                    message.addRouteError(routeName);
                    return;
                }
                sftpCall(sftp,sftpDownload);
            });
        }).on('error', err => {
            LOG.error(`[SFTP DOWNLOAD] ssh Connection Error- ${err}`);

            sftpDownload.flow.env[routeName] = {"busy": false};
            message.addRouteError(routeName);
        })
        .connect({
            host: sftpDownload.host,
            port: sftpDownload.port,
            username: sftpDownload.username,
            password: sftpDownload.password
        });
        let sftpCall = (sftp,sftpDownload) => {
            sftp.readdir(path.dirname(sftpDownload.path), async (err, files) => {
                if(err)LOG.error('[SFTP DOWNLOAD] readDir = '+err);
                if (!err){
                    if(!sftpDownload.flow.env.fileNum) sftpDownload.flow.env.fileNum = 0;
                    if(!files.length){ sftpDownload.flow.env[routeName] = {"busy": false}; connection.end();}
                    for(let fileThis in files){
                        if(sftpDownload.flow.env.fileNum > 1000) return;
                        else if (files[fileThis].filename.match(convertFSWildcardsToJSRegEx(path.basename(sftpDownload.path)))) {
                            sftpDownload.flow.env.fileNum++;
                            sftpDownload.flow.env[routeName] = { "busy": true };
                            await processFile(sftp,`${path.dirname(sftpDownload.path)}/${files[fileThis].filename}`, routeName, sftpDownload, messageContainer);
                        }
                    }
                }
            });
        }
        let processFile = async (sftp, file, routeName, sftpDownload, messageContainer) => {
            let initialPath = `${file}`,
                processingPath = `${file.substring(0,file.indexOf('/in/'))}/processing/${path.basename(file)}`,
                donePath = `${file.substring(0,file.indexOf('/in/'))}/done/${path.basename(file)}`;
            
            await sftpRenameFile(sftp, `${initialPath}`, `${processingPath}.downloading`, async function (err) {
                if (err) {
                    LOG.error(`[SFTP DOWNLOAD] sFTP Rename Error- ${err}`);
                    sftpDownload.flow.env[routeName] = {"busy": false};
                    sftpDownload.flow.env.fileNum--;
                    let message = MESSAGE_FACTORY.newMessage();
                    message.env.filepath = donePath;
                    message.addRouteError(routeName);
                    messageContainer.add(message);
                    return;
                }
                else {
                    let sftpFileDownloadPath = `${processingPath}.downloading`;
                    LOG.info(`Downloading started ${sftpFileDownloadPath}`);
        
                    let asbFilePath = `${sftpDownload.asbDownloadPath}${path.basename(initialPath)}.downloading`;
        
                    await sftp.fastGet(sftpFileDownloadPath, asbFilePath, async (err) => {
                        if (err) {
                            LOG.error(`[SFTP DOWNLAOD] sFTP Download Error- ${err}`);

                            sftpDownload.flow.env[routeName] = {"busy": false};
                            message.addRouteError(routeName);
                            return;
                        }
                        let newPath = asbFilePath.substring(0, asbFilePath.indexOf('.downloading'));
                        let status = await renameLocalFile(asbFilePath, newPath);
                        sftpRenameFile(sftp, `${processingPath}.downloading`, `${donePath}`, function (err) {
                            if (err) {
                                LOG.error(`[SFTP DOWNLOAD] sFTP Rename Error- ${err}`);
                                sftpDownload.flow.env.fileNum--;
                                sftpDownload.flow.env[routeName] = {"busy": false};
                                let message = MESSAGE_FACTORY.newMessage();
                                message.env.filepath = donePath;
                                message.addRouteError(routeName);
                                messageContainer.add(message);
                                return;
                            }
                            LOG.info(`Download completed ${path.basename(initialPath)}`);
                            sftpDownload.flow.env.fileNum--;
                            if(!sftpDownload.flow.env.fileNum){
                                LOG.info(`[SFTP DOWNLOAD] Connection close`);
                                sftpDownload.flow.env[routeName] = {"busy": false};
                                connection.end();
                            }
                            let message = MESSAGE_FACTORY.newMessage();
                            message.env.filepath = donePath;
                            message.addRouteDone(routeName);
                            messageContainer.add(message);
                        });
                    });
                }
            });
        }
}
let convertFSWildcardsToJSRegEx = (path) => {
    path = path.replace(/[-[\]{}()+.,\\^$|#\s]/g, '\\$&')
    path = path.replace("*", ".*");
    path = path.replace("?", ".+");
    return path + '$';
}
let sftpRenameFile = async (sftp, oldName, newName, cb) => {
    await sftp.rename(oldName, newName, cb);
}

let renameLocalFile = async (asbFilePath, newPath) => {
    try {
        return await rename(asbFilePath, newPath);
    } catch (error) {
        LOG.error('[SFTP DOWNLOAD] Local Rename Error - ' + error);

        sftpDownload.flow.env[routeName] = {"busy": false};
        sftpDownload.flow.env.fileNum--;
        message.addRouteError(routeName);
    }
}
