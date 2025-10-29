/* 
 * sftpupload.js - Upload a file to a sftp server.
 * 
 * (C) 2021 TekMonks. All rights reserved.
 */
const path = require("path");
const SSHClient = require("ssh2").Client;
const fspromises = require("fs").promises;
const utils = require(CONSTANTS.LIBDIR+"/utils.js");
const crypt = require(`${CONSTANTS.LIBDIR}/crypt.js`);

const _log = (logFunction, message, sshConnection) => logFunction.bind(LOG)(`[SFTPUPLOAD] [CONNECTION: ${sshConnection.__asb_id}] ${message}`);

exports.start = async (routeName, sftpupload, _messageContainer, message) => {
    if (message.env[routeName] && message.env[routeName].isBeingProcessed) return;    // already working on it.
    if (!message.env[routeName]) message.env[routeName] = {isBeingProcessed:true};
    message.setGCEligible(false);

    const timestamp = Date.now(); _log(ASBLOG.info,"Processing message with timestamp: "+message.timestamp,{__asb_id:timestamp});
    if (sftpupload.key) sftpupload.key = crypt.decrypt(sftpupload.key); 
    if (sftpupload.password) sftpupload.password = crypt.decrypt(sftpupload.password);
    if (!sftpupload.port) sftpupload.port = 22;

    const routeDone = (err, connection) => {
        connection.end(); if (err) _log(ASBLOG.error,`Encountered error ${err}`,connection);
        _log(ASBLOG.debug,"Disconnected from "+sftpupload.host,connection);
        delete message.env[routeName];                              // clean up our stuff
        message[err?"addRouteError":"addRouteDone"](routeName);     // done or error
        message.setGCEligible(true);                                // can collect it now
    }

    let localpath = sftpupload.localpath||message.env.localpath;
    if (!localpath) {
        localpath = utils.getTempFile(); if (!sftpupload.leaveTempFiles) localpath.__json_esb_delete = true;    // its a temp file to enable uploads
        _log(ASBLOG.info,`Message with timestamp ${message.timestamp} is being uploaded via local file ${localpath}`,{__asb_id:timestamp});
        await fspromises.writeFile(localpath, sftpupload.rawoutput?message.content:JSON.stringify(message.content));
    }

    const sftpLoginInfo = {host: sftpupload.host, port: sftpupload.port, username: sftpupload.user, 
        password: sftpupload.password, privateKey: sftpupload.key}
    const sshConnection = new SSHClient(); sshConnection.__asb_id = timestamp;
    sshConnection.on("ready", _ => {
        _log(ASBLOG.debug,`Connected to ${sftpupload.host}.`,sshConnection);
        sshConnection.sftp(async (err, sftpConnection) => {
            if (err) {routeDone(err, sshConnection); return;} // ssh connection error

            const remotepath = sftpupload.remotepath||message.env.remotepath; 
            if (!await _createRemoteDirIfNeeded(path.dirname(remotepath), sftpConnection, sshConnection)) {
                routeDone("Remote path not available", sshConnection); return; }
            
            _log(ASBLOG.debug,`Uploading ${localpath}->${remotepath} to ${sftpupload.host}`,sshConnection);
            sftpConnection.fastPut(localpath, remotepath, err => {
                if (localpath.__json_esb_delete) fspromises.rm(localpath);  // was a temp file to hold message content
                if (err) {routeDone(`Download error ${err}`, sshConnection); return;} // ssh download error
                else routeDone(null, sshConnection);
            });
        });
    }).on("error", err => routeDone(`Download error ${err}`, sshConnection)).connect(sftpLoginInfo);
}

function _createRemoteDirIfNeeded(directory, sftpConnection, sshConnection) {
    return new Promise(resolve => {
        sftpConnection.stat(directory, (err, _stats) => {
            if (err) sftpConnection.mkdir(directory, true, err => {
                if (err) {_log(ASBLOG.error,`Error creating remote path ${err}`,sshConnection); resolve(false);} 
                else resolve(true); // successfully created the remote path
            }); else resolve(true);  // path already exists
        });
    });
}