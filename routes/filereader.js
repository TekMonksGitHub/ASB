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
    message.setGCEligible(false);
    
    if(!filereader.flow.env.fileNum) filereader.flow.env.fileNum = 0;
    if(filereader.flow.env.fileNum > filereader.maxFileOpens) return;

    if (!message.env[routeName]) message.env[routeName] = {}; message.env[routeName].isBeingProcessed = true;
    
    filereader.flow.env.fileNum++;

    let handleError = e => {
        LOG.error(`[FILEREADER] ${e}`); message.addRouteError(routeName); message.setGCEligible(true); filereader.flow.env.fileNum--; return;}

    let handleReadResult = (e, data) => {
        if (e) handleError(`Read error: ${e}`); else {
            filereader.flow.env.fileNum--;
            try{message.content = JSON.parse(data);} catch(e){message.content = data;}
            message.addRouteDone(routeName);
            message.setGCEligible(true);
            delete message.env[routeName].isBeingProcessed; // clean our garbage
            LOG.info('[FILEREADER] success');

            if (filereader.donePath) try {
                let newPath = `${filereader.donePath}/${path.basename(message.env.filepath)}.${utils.getTimeStamp()}`;
                fs.rename(message.env.filepath, newPath, err => {if (err) LOG.error(`[FILEREADER] Error moving: ${err}`)});
            } catch (err) {LOG.error(`[FILEREADER] Error moving: ${err}`);}
        }
    }

    fs.readFile(message.env.filepath||filereader.path, filereader.encoding?filereader.encoding:null, handleReadResult);
}