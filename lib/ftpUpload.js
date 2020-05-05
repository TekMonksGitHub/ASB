/* 
 * ftp.js - Upload files on FTP server 
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const net = require('net');
const path = require('path');

exports.start = (routeName, ftp, messageContainer, message) => {
    if (message.env[routeName] && message.env[routeName].isBeingProcessed) return; // already working on it.
    message.setGCEligible(false);

    if (!ftp.flow.env.maxRequest) ftp.flow.env.maxRequest = 0;
    if(ftp.flow.env.maxRequest > 10 ) return;
    ftp.flow.env.maxRequest++;
    
    if (!message.env[routeName]) message.env[routeName] = {};
    message.env[routeName].isBeingProcessed = true;
    
    Socket = net.Socket;

    let dataSocket;

    let cmdSocket = new Socket();
    cmdSocket.setEncoding('binary')

    let server = undefined;

    let cmdSocketConnect = () => {
        LOG.info('[FTP UPLOAD] cmdsocket Connected!!');
    }


    let cmdSocketData = (chunk) => {
        LOG.info(chunk.toString('binary'));
        let code = chunk.substring(0, 3);
        if (chunk.split('\r\n').length > 2) {
            code = chunk.split('\r\n')[1].substring(0, 3);
        }
        if (code == '220') {
            sendFTPcommand('USER ' + ftp.username, () => {});
        } else if (code == '331') {
            sendFTPcommand('PASS ' + ftp.password, () => {});
        } else if (code == '530') {
            LOG.info('[FTP UPLOAD] Invalid FTP Credentials')
        } else if (code == '230') {
            sendFTPcommand('PASV', () => {});
        } else if (code == '227') {
            let pasvArray = chunk.substring(chunk.indexOf(`(`) + 1, chunk.indexOf(')')).split(',');
            let portNumber = parseInt(pasvArray[4] * 256) + parseInt(pasvArray[5]);
            createDataConnection(portNumber);
        } else if (code == '200') {
            sendFTPcommand(`CWD ${ftp.ftpFilePath}${ftp.ftpFolder}/in`, () => {});
        } else if (code == '150') {
            dataSocket.write((message.content));
            dataSocket.end();
            message.addRouteDone(routeName);
            message.setGCEligible(true);
            message.addEmitGCListener(message.content.length);
            delete message.env[routeName].isBeingProcessed; // clean our garbage
            ftp.flow.env.maxRequest--;
        }

        //transfer finished
        else if (code == '226') {
            sendFTPcommand('QUIT', () => {});
        } else if (code == '250') {
            sendFTPcommand(`STOR ${path.basename(message.env.filepath)}.${ftp.fileFormat}`, () => {});
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
        LOG.info('[FTP UPLOAD] cmdsocket half closed');
    }

    let cmdSocketClose = () => {
        LOG.info('[FTP UPLOAD] cmdsocket closed');
    }

    cmdSocket.once('connect', cmdSocketConnect);
    cmdSocket.on('data', cmdSocketData);
    cmdSocket.on('end', cmdSocketEnd);
    cmdSocket.on('close', cmdSocketClose);
    cmdSocket.on('error', (error) => {
        LOG.error(`[FTP UPLOAD] cmdsocket error - ${error}`);
    });

    cmdSocket.connect(ftp.port, ftp.host);

    let sendFTPcommand = (cmd, callback) => {
        LOG.info(cmd);
        cmdSocket.write(cmd + '\r\n', 'binary', callback);
    }


    let createDataConnection = (portNumber) => {
        var socket = net.connect({host: ftp.host,port: portNumber}, function () {
            LOG.info('connected to server!');
            dataSocket = socket;
            sendFTPcommand('NOOP', () => {});
        });

        socket.on('data', function (data) {
            LOG.info(`[FTP UPLOAD] socket data - ${data}`);
        });

        socket.on('end', function () {
            LOG.info(`[FTP UPLOAD] socket end`);
        });

        socket.on('close', function () {
            LOG.info(`[FTP UPLOAD] socket close`);
        });

        socket.on('error', (error) => {
            LOG.error(`[FTP UPLOAD] socket error - ${error}`);
        });
    }
}
