/* 
 * filewriter.js - Write the message to a file
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const fs = require("fs");

exports.start = (routeName, filewriter, _messageContainer, message) => {
    if (message.env[routeName] && message.env[routeName].isBeingProcessed) return;    // already working on it.
    if (!message.env[routeName]) message.env[routeName] = {}; message.env[routeName].isBeingProcessed = true;

    let handleError = e => {LOG.error(`[FILEWRITER] ${e}`); message.addRouteDone(`${routeName}.error`); return;}

    let handleWriteResult = e => {
        if (e) handleError(`Write error: ${e}`); else {
            message.addRouteDone(routeName);
            delete message.env[routeName].isBeingProcessed; // clean our garbage
        }
    }

    let output = (message.content instanceof Object ? JSON.stringify(message.content, null, filewriter.prettyJSON) :
        message.content);
    let writer = (filewriter.append ? fs.appendFile : fs.writeFile);
    writer(filewriter.path, output, handleWriteResult);
}