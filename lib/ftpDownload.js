/* 
* ftpDownload.js - Download files from ftp server 
* 
* (C) 2018 TekMonks. All rights reserved.
*/

const net = require('net');
const fs = require('fs');
const path = require('path');

exports.start = (routeName, ftpDownload, messageContainer, message) => {
    if (ftpDownload.flow.env[routeName] && ftpDownload.flow.env[routeName].busy) return; // we are busy processing
    ftpDownload.flow.env[routeName] = { "busy": true };
    
    Socket = net.Socket;

    let cmdSocket = new Socket();
    cmdSocket.setEncoding('binary')

    let server = undefined;
    let files = '';
    let retrieveFiles = true;
    let fileNumber = 0;
    let filename = '';
    let RETRcmd = true;
    let downloading = false;
    let fetchCompleted = true;
    let totalFolder = ftpDownload.ftpFolder.length;

    let fetchFile = (folderPath,filePathArray) => {
        while(totalFolder >= 0 && fetchCompleted){
            fetchCompleted = false;
            
            files = '';
            fileNumber = 0;
            sendFTPcommand(`NLST ${folderPath}${filePathArray[totalFolder]}/in`, () => {});
        }
        if(totalFolder < 0) {
            sendFTPcommand('QUIT', () => {});
            let message = MESSAGE_FACTORY.newMessage();
            
            message.addRouteDone(routeName);
            messageContainer.add(message);
            ftpDownload.flow.env[routeName] = { "busy": false };
        }
    }

    let cmdSocketConnect = () => {
        LOG.info('[FTP DOWNLOAD] Connected with server');
    }

    let cmdSocketData = (chunk) => {
        LOG.info(chunk.toString('binary'));
        let code = chunk.substring(0, 3);
        if(chunk.split('\r\n').length > 2){
            code = chunk.split('\r\n')[1].substring(0,3);
        }
        if (code == '220') {
            sendFTPcommand('USER ' + ftpDownload.username, () => {});
        } else if (code == '331') {
            sendFTPcommand('PASS ' + ftpDownload.password, () => {});
        } else if(code == '530'){
            LOG.error('Invalid FTP Credentials','[ERROR]','FTP-01','FTP error');
            ftpDownload.flow.env[routeName] = { "busy": false };
        }else if (code == '230') {
            sendFTPcommand('PASV', () => {});
        } else if (code == '227') {
            let pasvArray = chunk.substring(chunk.indexOf(`(`) + 1, chunk.indexOf(')')).split(',');
            let portNumber = parseInt(pasvArray[4]*256)+parseInt(pasvArray[5]);
            createDataConnection(portNumber);
        } else if (code == '200') {
            if (files.length > 0) {
                downloading = false;
                RETRcmd = true;
                sendFTPcommand('RNFR ' + files[fileNumber], () => {});
                filename = files[fileNumber].substring(files[fileNumber].lastIndexOf('/')+1);
                if (fileNumber == files.length - 1) files = '';
                fileNumber++;
            } else if (retrieveFiles) {
                --totalFolder;
                fetchFile(ftpDownload.ftpFilePath,ftpDownload.ftpFolder);
            }else {
                fetchCompleted = true;
                retrieveFiles = true;
                sendFTPcommand('NOOP', () => {});
            }
        } else if (code == '350') {
            if (downloading) newPath = `${ftpDownload.ftpFilePath}${ftpDownload.ftpFolder[totalFolder]}/${ftpDownload.ftpDonePath}/${filename.substring(0, filename.indexOf('downloading') - 1)}`;
            else newPath = `${ftpDownload.ftpFilePath}${ftpDownload.ftpFolder[totalFolder]}/${ftpDownload.ftpProcessingPath}/${filename}.downloading`;
            if (!retrieveFiles) sendFTPcommand(`RNTO ${newPath}`, () => {});
        }

        //transfer finished
        else if (code == '226') {
            if (!retrieveFiles) sendFTPcommand(`RNFR ${ftpDownload.ftpFilePath}${ftpDownload.ftpFolder[totalFolder]}/${ftpDownload.ftpProcessingPath}/${filename}`, () => {});
            else {
                if(ftpDownload.flow.env.fileNumber > 1000) return;
                ftpDownload.flow.env.fileNumber++;
                setTimeout(()=>{
                    sendFTPcommand('PASV', () => {});
                    retrieveFiles = false;
                },1000*10);
            }
        } else if (code == '250') {
            if (RETRcmd) {
                RETRcmd = false;
                downloading = true;
                filename = `${filename}.downloading`;
                sendFTPcommand(`RETR ${ftpDownload.ftpFilePath}${ftpDownload.ftpFolder[totalFolder]}/${ftpDownload.ftpProcessingPath}/${filename}`, () => {});
                return;
            }

            ftpDownload.flow.env.fileNumber--;
            if(!totalFolder && !files.length){
                sendFTPcommand('QUIT', () => {});
                
                let message = MESSAGE_FACTORY.newMessage();
                
                message.addRouteDone(routeName);
                messageContainer.add(message);
                ftpDownload.flow.env[routeName] = { "busy": false };
            } 
            sendFTPcommand('PASV', () => {});
        }

        //session end
        else if (code == '221') {
            cmdSocket.end(null, () => {});
            if (!!server) {
                server.close();
            }
        }
    }

    let cmdSocketEnd = () => {
        LOG.info('half closed');
    }

    let cmdSocketClose = () => {
        LOG.info('closed');
        ftpDownload.flow.env[routeName] = { "busy": false };
    }

    cmdSocket.once('connect', cmdSocketConnect);
    cmdSocket.on('data', cmdSocketData);
    cmdSocket.on('end', cmdSocketEnd);
    cmdSocket.on('close', cmdSocketClose);
    cmdSocket.on('error', (error) => {
        if(error){
            LOG.error(`FTP server not reachable cmdsocket error ${error}`);
            ftpDownload.flow.env[routeName] = { "busy": false };
        }
    });

    cmdSocket.connect(ftpDownload.port, ftpDownload.host);

    let sendFTPcommand = (cmd, callback) => {
        LOG.info(cmd);
        cmdSocket.write(cmd + '\r\n', 'binary', callback);
    }
    

    let createDataConnection = (portNumber) => {
        let responseString = '';
        var socket = net.connect({host:ftpDownload.host, port: portNumber}, function() {
                LOG.info('connected to server!');  
                sendFTPcommand('NOOP',()=>{}); 
         });
         
         socket.on('data', function(data) {
            if (retrieveFiles) {
                responseString += data.toString();
            } else if(filename != ''){
                fs.appendFile(`${ftpDownload.asbDownloadPath}/${path.basename(filename)}`, data, (err) => {
                    if(err) LOG.error(`[FTP DOWNLOAD] APPEND FILE ERROR : ${err}`);
                });
            }
         });
         
         socket.on('end', function() {
            if(retrieveFiles){
                files = responseString.split('\r\n');
                files.pop(); 
            }else if(filename != '')
                fs.rename(`${ftpDownload.asbDownloadPath}/${filename}`, `${ftpDownload.asbDownloadPath}/${filename.substring(0,filename.indexOf('downloading') - 1)}`, (err) => {
                    if(!err && filename != ""){
                        LOG.info(`[FTP DOWNLOAD] ${filename.substring(0,filename.indexOf('downloading') - 1)} fetched successfully`);
                        ftpDownload.flow.env.idocFileName = filename.substring(0,filename.indexOf('downloading') - 1);
                    }
                    if(err) LOG.error(`[FTP Download] ${err}`);
                });
        });

        socket.on('close', function() {});

        socket.on('error', (error) => {
            if(error) LOG.error(`FTP server not reachable socket error ${error}`);
        });
    }
}