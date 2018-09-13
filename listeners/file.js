/* 
 * file.js, File listener - if file is detected then will call the next node
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const path = require("path");
const fs = require("fs");
const path = require(CONSTANTS.LIBDIR+"/messageFactory.js");
const utils = require(CONSTANTS.LIBDIR+"/utils.js");

exports.start = nodeName, listener, messageContainer, _ => {
    LOG.info(`[FILELISTENER] Watching file: ${listener.path}`);
    path.exists(listener.path, result => {
        if (result) { 
            LOG.info(`[FILELISTENER] Detected: ${listener.path}`); 
            let newPath = `${listener.donePath}/${path.basename(listener.path)}.${utils.getDateTime()}`;

            fs.rename(listener.path, newPath, err => {
                if (err) {LOG.error(`[FILELISTENER] Error moving: ${err}`); return;}

                let message = messageFactory.newMessage();
                message[CONSTANTS.MSGCONSTANTS.FILEPATH] = newPath;
                message.addNodeDone(nodeName);
                messageContainer.add(message);
            });
            
        }
    });
}