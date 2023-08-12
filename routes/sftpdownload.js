/* 
 * sftpdownload.js - Download a file from a sftp server.
 * 
 * (C) 2021 TekMonks. All rights reserved.
 */
const SSHClient = require("ssh2").Client;
const fspromises = require("fs").promises;
const crypt = require(`${CONSTANTS.LIBDIR}/crypt.js`);

const _log = (logFunction, message, sshConnection) => logFunction.bind(LOG)(`[SFTPDOWNLOAD] [CONNECTION: ${sshConnection.__asb_id}] ${message}`);

exports.start = (routeName, sftpdownload, _messageContainer, message) => {
    if (message.env[routeName] && message.env[routeName].isBeingProcessed) return;    // already working on it.
    if (!message.env[routeName]) message.env[routeName] = {isBeingProcessed:true};
    message.setGCEligible(false);

    const timestamp = Date.now(); _log(LOG.info,"Processing message with timestamp: "+message.timestamp,{__asb_id:timestamp});
    if (sftpdownload.key) sftpdownload.key = crypt.decrypt(sftpdownload.key); 
    if (sftpdownload.password) sftpdownload.password = crypt.decrypt(sftpdownload.password);
    if (!sftpdownload.port) sftpdownload.port = 22;

    const routeDone = (err, connection, content) => {
        connection.end(); if (err) _log(LOG.error,`Encountered error ${err}`,connection);
        _log(LOG.debug,"Disconnected from "+sftpdownload.host,connection);
        delete message.env[routeName];                              // clean up our stuff
        message[err?"addRouteError":"addRouteDone"](routeName);     // done or error
        message.setGCEligible(true);                                // can collect it now
        if (content) message.content = sftpdownload.rawoutput?content:JSON.stringify(content);  // set content if passed
    }

    const sftpLoginInfo = {host: sftpdownload.host, port: sftpdownload.port, username: sftpdownload.user, 
        password: sftpdownload.password, privateKey: sftpdownload.key}, remotePath = sftpdownload.remotePath||message.env.remotePath,
        localpath = sftpdownload.localPath||message.env.localPath;
    if (!localpath) {
        localpath = utils.getTempFile(); if (!sftpdownload.leaveTempFiles) localpath.__json_esb_delete = true;    // its a temp file to enable uploads
        _log(LOG.info,`Message with timestamp ${message.timestamp} is being downloaded via temp local file ${localpath}`,{__asb_id:timestamp});
    }
    const sshConnection = new SSHClient(); sshConnection.__asb_id = timestamp;
    sshConnection.on("ready", _ => {
        _log(LOG.debug,`Connected to ${sftpupload.host}.`,sshConnection);
        sshConnection.sftp((err, sftpConnection) => {
            if (err) {routeDone(err, sshConnection); return;} // ssh connection error

            _log(LOG.debug,`Downloading ${remotePath}->${localpath} from ${sftpdownload.host}`,sshConnection);
            sftpConnection.fastGet(remotePath, localpath, async err => {
                if (err) {routeDone(`Download error ${err}`, sshConnection); return;} // ssh download error
                const content = !(sftpdownload.localPath||message.env.localPath) ? await fspromises.readFile(localpath) : undefined;
                if (localpath.__json_esb_delete) fspromises.rm(localpath);  // was a temp file to hold message content
                routeDone(null, sshConnection, content);
            });
        });
    }).on("error", err => routeDone(`Download error ${err}`, sshConnection)).connect(sftpLoginInfo);
}
