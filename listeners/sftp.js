/* 
 * sftp.js, sftp file listener - if file is detected then will call the next node
 * 
 * (C) 2021 TekMonks. All rights reserved.
 */

const path = require("path");
const SSHClient = require("ssh2").Client;
const utils = require(CONSTANTS.LIBDIR+"/utils.js");
const crypt = require(`${CONSTANTS.LIBDIR}/crypt.js`);

const _log = (logFunction, message, sshConnection) => logFunction.bind(LOG)(`[SFTP_LISTENER] [CONNECTION: ${sshConnection.__asb_id}] ${message}`);

exports.start = (routeName, sftp, messageContainer, _message) => {
    if (sftp.flow.env[routeName] && sftp.flow.env[routeName].busy) return;  // we are busy processing
    
    const timestamp = Date.now(); _log(LOG.debug,`Watching file/s: ${sftp.path} on ${sftp.host}`,{__asb_id: timestamp});
    if (sftp.key) sftp.key = crypt.decrypt(sftp.key); 
    if (sftp.password) sftp.password = crypt.decrypt(sftp.password);
    if (!sftp.port) sftp.port = 22;

    const countFilesProcessed = (count, connection, totalToProcess) => {
        count++; if (count == totalToProcess) { connection.end(); _log(LOG.debug,"Disconnected from "+sftp.host, sshConnection); 
            sftp.flow.env[routeName] = {"busy":false}; } 
        return count;
    }

    const sshConnection = new SSHClient(); sshConnection.__asb_id = timestamp; sftp.flow.env[routeName] = {"busy":true};
    sshConnection.on("ready", _ => {
        _log(LOG.debug,"sftp client is connected",sshConnection);
        sshConnection.sftp((err, sftpConnection) => {
            if (err) {  // ssh connection error
                _log(LOG.error,"sftp error: "+err, sshConnection); _log(LOG.debug,"Disconnected from "+sftp.host, sshConnection);
                sshConnection.end(); sftp.flow.env[routeName] = {"busy":false}; 
                return;
            }

            sftpConnection.readdir(path.dirname(sftp.path), (err, files) => {
                if (err || files.length == 0) {  // sftp readdir error
                    if (err) _log(LOG.error,"sftp error: "+err,sshConnection); 
                    _log(LOG.debug, "Disconnected from "+sftp.host, sshConnection);
                    sshConnection.end(); sftp.flow.env[routeName] = {"busy":false}; 
                    return;
                }
                    
                let filesProcessed = 0;
                for (const fileThis of files) if (fileThis.filename.match(convertFSWildcardsToJSRegEx(path.basename(sftp.path))))
                    processFile(`${path.dirname(sftp.path)}/${fileThis.filename}`, routeName, sftp, messageContainer, sftpConnection, sshConnection, _=> filesProcessed = countFilesProcessed(filesProcessed, sshConnection, files.length));
                else filesProcessed = countFilesProcessed(filesProcessed, sshConnection, files.length);
            });
        });
    }).on("error", err => {
        _log(LOG.error,"ssh connect error: "+err, sshConnection); 
        sshConnection.end(); sftp.flow.env[routeName] = {"busy":false}; 
        return;
    }).connect({host: sftp.host, port: sftp.port, username: sftp.user, password: sftp.password, privateKey: sftp.key});
}

function convertFSWildcardsToJSRegEx(path) {
    path = path.replace(/[-[\]{}()+.,\\^$|#\s]/g, '\\$&')
    path = path.replace("*", ".*");
    path = path.replace("?", ".+");
    return path;
}

function processFile(file, routeName, listener, messageContainer, sftpConnection, sshConnection, callback) {
    _log(LOG.info,`Detected: ${file}`,sshConnection); 
    const newPath = `${listener.donePath}/${path.basename(file)}.${utils.getTimeStamp()}`;
    const newRemotePath = `${listener.remoteDonePath}/${path.basename(file)}.${utils.getTimeStamp()}`;

    const message = MESSAGE_FACTORY.newMessageAllocSafe();
    if (!message) {_log(LOG.error,"Message creation error, throttling listener.",sshConnection); callback("Throttling error"); return;}
    sftpConnection.fastGet(file, newPath, err => {
        if (err) {_log(LOG.error,`Error downloading: ${err}`,sshConnection); callback(err); return;}
        sftpConnection.rename(file, newRemotePath, err => {
            if (err) {_log(LOG.error,`Error renaming remote file: ${err}`,sshConnection); callback(err); return;}
            message.env.filepath = newPath;
            message.addRouteDone(routeName);
            messageContainer.add(message);
            _log(LOG.info,`Injected message with timestamp: ${message.timestamp}`,sshConnection); 
            callback();
        });
    });
}