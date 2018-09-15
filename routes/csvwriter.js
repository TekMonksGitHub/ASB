/* 
 * csvwriter.js - Convert JSON to CSV and write to a file
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const fs = require("fs");

exports.start = (routeName, csvwriter, _messageContainer, message) => {
    if (message.env[routeName] && message.env[routeName].isBeingProcessed) return;    // already working on it.
    if (!message.env[routeName]) message.env[routeName] = {}; message.env[routeName].isBeingProcessed = true;

    let handleError = e => {LOG.error(`[CSVWRITER] ${e}`); message.addRouteDone(`${routeName}.error`); return;}

    if (!message.content) {handleError("No content. Skipping."); return;}

    let headers = ""; let values = ""; let keys = Object.keys(message.content);

    keys.forEach((k, i) => {
        if (k.indexOf(",") > -1) headers += `"${k}"`; else headers += k;
        if (message.content[k].indexOf(",") > -1) values += `"${message.content[k]}"`; else values += message.content[k];

        if (i+1 != keys.length) { headers += ","; values += ","; }
    })
    
    fs.access(csvwriter.path, fs.constants.F_OK, error => {
        let handleWriteResult = e => {if (e) handleError(`Write error: ${e}`); else message.addRouteDone(routeName);};

        if (!error) fs.appendFile(csvwriter.path, `${values}\n`, handleWriteResult);
        else fs.writeFile(csvwriter.path, `${headers}\n${values}\n`, handleWriteResult);
    });
}