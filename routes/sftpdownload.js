/* 
 * sftpdownload.js - Download a file from a sftp server.
 * 
 * (C) 2021 TekMonks. All rights reserved.
 */
const SSHClient = require("ssh2").Client;
const crypt = require(`${CONSTANTS.LIBDIR}/crypt.js`);

exports.start = (routeName, sftpdownload, _messageContainer, message) => {
    if (message.env[routeName] && message.env[routeName].isBeingProcessed) return;    // already working on it.
    if (!message.env[routeName]) message.env[routeName] = {isBeingProcessed:true};
    message.setGCEligible(false);

    LOG.info("[SFTPDOWNLOAD] Processing message with timestamp: "+message.timestamp);
    if (sftpdownload.key) sftpdownload.key = crypt.decrypt(sftpdownload.key); 
    if (sftpdownload.password) sftpdownload.password = crypt.decrypt(sftpdownload.password);
    if (!sftpdownload.port) sftpdownload.port = 22;

    const routeDone = (err, connection) => {
        connection.end(); if (err) LOG.error(`[SFTPDOWNLOAD] Encountered error ${err}`)
        LOG.debug("[SFTPDOWNLOAD] Disconnected from "+sftpdownload.host);
        delete message.env[routeName];                              // clean up our stuff
        message[err?"addRouteError":"addRouteDone"](routeName);     // done or error
        message.setGCEligible(true);                                // can collect it now
    }

    const sftpLoginInfo = {host: sftpdownload.host, port: sftpdownload.port, username: sftpdownload.user, 
        password: sftpdownload.password, privateKey: sftpdownload.key}, remotePath = sftpdownload.remotePath||message.env.remotePath,
        localPath = sftpdownload.localPath||message.env.localPath;
    const sshConnection = new SSHClient(); 
    sshConnection.on("ready", _ => {
        LOG.debug("[SFTPDOWNLOAD] sftp client is connected.");
        sshConnection.sftp((err, sftpConnection) => {
            if (err) {routeDone(err, sshConnection); return;} // ssh connection error

            LOG.debug(`[SFTPDOWNLOAD] Downloading ${remotePath}->${localPath} from ${sftpdownload.host}`);
            sftpConnection.fastGet(remotePath, localPath, err => {
                if (err) {routeDone(`Download error ${err}`, sshConnection); return;} // ssh download error
                else routeDone(null, sshConnection);
            });
        });
    }).on("error", err => routeDone(`Download error ${err}`, sshConnection)).connect(sftpLoginInfo);
}
