/* 
 * file.js, File listener - if file is detected then will call the next node
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const fs = require("fs");
const path = require("path");
const utils = require(CONSTANTS.LIBDIR+"/utils.js");

exports.start = (routeName, listener, messageContainer, _message) => {
    LOG.debug(`[FILELISTENER] Watching file: ${listener.path}`);
    fs.access(listener.path, fs.constants.F_OK, error => {
        if (!error) { 
            LOG.info(`[FILELISTENER] Detected: ${listener.path}`); 
            let newPath = `${listener.donePath}/${path.basename(listener.path)}.${utils.getTimeStamp()}`;

            fs.rename(listener.path, newPath, err => {
                if (err) {LOG.error(`[FILELISTENER] Error moving: ${err}`); return;}

                let message = MESSAGE_FACTORY.newMessage();
                message.env.path = newPath;
                message.addRouteDone(routeName);
                messageContainer.add(message);
                LOG.info(`[FILELISTENER] Injected message with timestamp: ${message.timestamp}`); 
            });
        }
    });
}