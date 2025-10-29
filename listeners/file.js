/* 
 * file.js, File listener - if file is detected then will call the next node
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const fs = require("fs");
const path = require("path");
const utils = require(CONSTANTS.LIBDIR+"/utils.js");

exports.start = (routeName, listener, messageContainer, _message) => {
    if (listener.flow.env[routeName] && listener.flow.env[routeName].busy) return;  // we are busy processing
    if (!listener.flow.env[routeName]) {
        listener.flow.env[routeName] = {initialized: true};
        ASBLOG.debug(`[FILE_LISTENER] Watching file/s: ${listener.path}`); // logging once is enough
    }

    const countFilesProcessed = (count, totalToProcess) => {
        count++; 
        if (count == totalToProcess) listener.flow.env[routeName] = {"busy":false};
        return count;
    }

    listener.flow.env[routeName].busy = true; let filesProcessed = 0;
    fs.readdir(path.dirname(listener.path), (err, files) => {
        if (!err && files.length) for (const fileThis of files) if (fileThis.match(convertFSWildcardsToJSRegEx(path.basename(listener.path)))) 
            processFile(`${path.dirname(listener.path)}/${fileThis}`, routeName, listener, messageContainer,
                _ => filesProcessed = countFilesProcessed(filesProcessed, files.length) );
            else filesProcessed = countFilesProcessed(filesProcessed, files.length);
        else { if (err) ASBLOG.error(`File listener error: ${err}`); listener.flow.env[routeName].busy = false; }
    });
}

function convertFSWildcardsToJSRegEx(path) {
    path = path.replace(/[-[\]{}()+.,\\^$|#\s]/g, '\\$&')
    path = path.replace("*", ".*");
    path = path.replace("?", ".+");
    return path;
}

function processFile(file, routeName, listener, messageContainer, cb) {
    ASBLOG.info(`[FILE_LISTENER] Detected: ${file}`); 
    const newPath = `${listener.donePath}/${path.basename(file)}.${utils.getTimeStamp()}`;

    const message = MESSAGE_FACTORY.newMessageAllocSafe();
    if (!message) {ASBLOG.error("[FILE_LISTENER] Message creation error, throttling listener."); return;}
    fs.rename(file, newPath, err => {
        if (err) {ASBLOG.error(`[FILE_LISTENER] Error moving: ${err}`); cb(); return;}

        message.env.filepath = newPath;
        message.addRouteDone(routeName);
        messageContainer.add(message);
        ASBLOG.info(`[FILE_LISTENER] Injected message with timestamp: ${message.timestamp}`); 
        cb();
    });
}