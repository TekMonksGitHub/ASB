/* 
 * filereader.js - Read contents of a file
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const fs = require("fs");
const path = require("path");
const utils = require(CONSTANTS.LIBDIR+"/utils.js");

exports.start = (routeName, filereader, _messageContainer, message) => {
    if (message.env[routeName] && message.env[routeName].isBeingProcessed) return;    // already working on it.
    if (!message.env[routeName]) message.env[routeName] = {}; message.env[routeName].isBeingProcessed = true;
    message.setGCEligible(false);

    let handleError = e => {
        LOG.error(`[FILEREADER] ${e}`); message.addRouteError(routeName); message.setGCEligible(true); return;}

    let handleReadResult = (e, data) => {
        if (e) handleError(`Read error: ${e}`); else {
            try{message.content = JSON.parse(data);} catch(e){message.content = data;}
            message.addRouteDone(routeName);
            message.setGCEligible(true);
            delete message.env[routeName].isBeingProcessed; // clean our garbage

            if (filereader.donePath) try {
                let newPath = `${filereader.donePath}/${path.basename(message.env.path)}.${utils.getTimeStamp()}`;
                fs.rename(message.env.path, newPath, err => {if (err) LOG.error(`[FILEREADER] Error moving: ${err}`)});
            } catch (e) {LOG.error(`[FILEREADER] Error moving: ${err}`);}
        }
    }

    fs.readFile(message.env.filepath, filereader.encoding?filereader.encoding:null, handleReadResult);
}