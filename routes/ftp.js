/* 
* ftp.js - Download files from ftp server 
* 
* (C) 2018 TekMonks. All rights reserved.
*/

const net = require('net');
const fs = require('fs');
const path = require('path');
const rootdir = path.resolve(__dirname+'/../');
const logFile = require(rootdir+'/custom/createLog');
const utils = require(rootdir + '/lib/utils');

exports.start = (routeName, ftp, messageContainer, message) => {
    if (message.env[routeName] && message.env[routeName].isBeingProcessed) return;    // already working on it.
    if (!message.env[routeName]) message.env[routeName] = {}; message.env[routeName].isBeingProcessed = true;
    message.setGCEligible(false);
    
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
    let totalFolder = ftp.ftpFolder.length;

    
    let logCreation = (logMessage, logStatus, logCode, logSubject) => {
        message.env.log_message = {
            time: utils.getDateTime(),
            status: logStatus,
            code: logCode,
            subject: logSubject,
            message: logMessage
        };
        logFile.start(routeName,ftp,messageContainer,message);
    }

    let fetchFile = (folderPath,filePathArray) => {
        while(totalFolder >= 0 && fetchCompleted){
            fetchCompleted = false;
            
            files = '';
            fileNumber = 0;
            sendFTPcommand(`NLST ${folderPath}${filePathArray[totalFolder]}/in`, () => {});
        }
        if(totalFolder < 0) sendFTPcommand('QUIT', () => {});
    }

    let cmdSocketConnect = () => {}


    let cmdSocketData = (chunk) => {
        LOG.info(chunk.toString('binary'));
        let code = chunk.substring(0, 3);
        if(chunk.split('\r\n').length > 2){
            code = chunk.split('\r\n')[1].substring(0,3);
        }
        if (code == '220') {
            sendFTPcommand('USER ' + ftp.username, () => {});
        } else if (code == '331') {
            sendFTPcommand('PASS ' + ftp.password, () => {});
        } else if(code == '530'){
            logCreation('Invalid FTP Credentials','[ERROR]','FTP-01','FTP error')
        }else if (code == '230') {
            sendFTPcommand('PASV', () => {});
        } else if (code == '227') {
            let pasvArray = chunk.substring(chunk.indexOf(`(`) + 1, chunk.indexOf(')')).split(',');
            let portNumber = parseInt(pasvArray[4]*256)+parseInt(pasvArray[5]);
            console.log('Port Number'+portNumber+'    '+pasvArray);
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
                fetchFile(ftp.ftpFilePath,ftp.ftpFolder);
            }else {
                fetchCompleted = true;
                retrieveFiles = true;
                sendFTPcommand('NOOP', () => {});
            }
        } else if (code == '350') {
            if (downloading) newPath = `${ftp.ftpFilePath}${ftp.ftpFolder[totalFolder]}/${ftp.ftpDonePath}/${filename.substring(0, filename.indexOf('downloading') - 1)}`;
            else newPath = `${ftp.ftpFilePath}${ftp.ftpFolder[totalFolder]}/${ftp.ftpProcessingPath}/${filename}.downloading`;
            if (!retrieveFiles) sendFTPcommand(`RNTO ${newPath}`, () => {});
        }

        //transfer finished
        else if (code == '226') {
            if (!retrieveFiles) sendFTPcommand(`RNFR ${ftp.ftpFilePath}${ftp.ftpFolder[totalFolder]}/${ftp.ftpProcessingPath}/${filename}`, () => {});
            else {
                sendFTPcommand('PASV', () => {});
                retrieveFiles = false;
            }
        } else if (code == '250') {
            if (RETRcmd) {
                RETRcmd = false;
                downloading = true;
                filename = `${filename}.downloading`;
                sendFTPcommand(`RETR ${ftp.ftpFilePath}${ftp.ftpFolder[totalFolder]}/${ftp.ftpProcessingPath}/${filename}`, () => {});
                return;
            }
            if(!totalFolder && !files.length){
                sendFTPcommand('QUIT', () => {});
                message.addRouteDone(routeName);
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
    }

    cmdSocket.once('connect', cmdSocketConnect);
    cmdSocket.on('data', cmdSocketData);
    cmdSocket.on('end', cmdSocketEnd);
    cmdSocket.on('close', cmdSocketClose);
    cmdSocket.on('error', (error) => {
        if(error) logCreation(`FTP server not reachable`, '[ERROR]', 'S-FTP01','FTP Error');
    });

    cmdSocket.connect(ftp.port, ftp.host);

    let sendFTPcommand = (cmd, callback) => {
        LOG.info(cmd);
        cmdSocket.write(cmd + '\r\n', 'binary', callback);
    }
    

    let createDataConnection = (portNumber) => {
        var socket = net.connect({host:ftp.host, port: portNumber}, function() {
                LOG.info('connected to server!');  
                sendFTPcommand('NOOP',()=>{}); 
         });
         
         socket.on('data', function(data) {
            if (retrieveFiles) {
                files = data.toString().split('\r\n');
                files.pop();
            } else {
                fs.appendFile(`${ftp.asbDownloadPath}${ftp.ftpFolder[totalFolder]}/in/${filename}`, data, (err) => {});
            }
         });
         
         socket.on('end', function() { 
            fs.rename(`${ftp.asbDownloadPath}${ftp.ftpFolder[totalFolder]}/in/${filename}`, `${ftp.asbDownloadPath}${ftp.ftpFolder[totalFolder]}/in/${filename.substring(0,filename.indexOf('downloading') - 1)}`, (err) => {
                if(!err && filename != ""){
                    logCreation(`${filename.substring(0,filename.indexOf('downloading') - 1)} fetched successfully`, '[SUCCESS]', 'S-FTP01');
                    ftp.flow.env.idocFileName = filename.substring(0,filename.indexOf('downloading') - 1);
                }
            });
         });

        socket.on('close', function() {});

        socket.on('error', (error) => {
            if(error) logCreation(`FTP server not reachable`, '[ERROR]', 'S-FTP01','FTP Error');
        });
    }
}