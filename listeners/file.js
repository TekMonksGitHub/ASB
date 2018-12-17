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
    
    LOG.debug(`[FILELISTENER] Watching file/s: ${listener.path}`);

    fs.readdir(path.dirname(listener.path), (err, files) => {
        if (!err) files.forEach(fileThis => {
            if (fileThis.match(convertFSWildcardsToJSRegEx(path.basename(listener.path)))) {
                listener.flow.env[routeName] = {"busy":true};
                processFile(`${path.dirname(listener.path)}/${fileThis}`, routeName, listener, messageContainer,
                    _ => listener.flow.env[routeName] = {"busy":false});
            }
        })
    });
}

function convertFSWildcardsToJSRegEx(path) {
    path = path.replace(/[-[\]{}()+.,\\^$|#\s]/g, '\\$&')
    path = path.replace("*", ".*");
    path = path.replace("?", ".+");
    return path;
}

function processFile(file, routeName, listener, messageContainer, cb) {
    LOG.info(`[FILELISTENER] Detected: ${file}`); 
    let newPath = `${listener.donePath}/${path.basename(file)}.${utils.getTimeStamp()}`;

    fs.rename(file, newPath, err => {
        if (err) {LOG.error(`[FILELISTENER] Error moving: ${err}`); cb(); return;}

        let message = MESSAGE_FACTORY.newMessage();
        message.env.filepath = newPath;
        message.addRouteDone(routeName);
        messageContainer.add(message);
        LOG.info(`[FILELISTENER] Injected message with timestamp: ${message.timestamp}`); 
        cb();
    });
}