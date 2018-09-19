/* 
 * csvwriter.js - Convert JSON to CSV and write to a file
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const fs = require("fs");
const papa = require("papaparse"); 

exports.start = (routeName, csvwriter, _messageContainer, message) => {
    if (message.env[routeName] && message.env[routeName].isBeingProcessed) return;    // already working on it.
    if (!message.env[routeName]) message.env[routeName] = {}; message.env[routeName].isBeingProcessed = true;
    message.setGCEligible(false);

    let handleError = e => {
        LOG.error(`[CSVWRITER] ${e}`); message.addRouteError(routeName); message.setGCEligible(true); return;}

    let keys = Object.keys(message.content);

    // sanity tests
    if (!message.content) {handleError("No content. Skipping."); return;}
    if (csvwriter.headers && (keys.length != csvwriter.headers.length)) 
        {handleError("Header / Data mismatch. Check specified headers."); return;}

    // let convert...
    let values = []; keys.forEach(k => values.push(message.content[k]));
    let headersCSV = (csvwriter.headers?papa.unparse([csvwriter.headers]):papa.unparse([keys]));
    let valuesCSV = papa.unparse([values]);
    
    // write it out
    fs.access(csvwriter.path, fs.constants.F_OK, error => {
        let handleWriteResult = e => {
            if (e) handleError(`Write error: ${e}`); else {
                message.addRouteDone(routeName);
                message.setGCEligible(true);
                delete message.env[routeName].isBeingProcessed; // clean our garbage
            }
        }

        if (!error) fs.appendFile(csvwriter.path, `${valuesCSV}\n`, handleWriteResult);
        else fs.writeFile(csvwriter.path, `${headersCSV}\n${valuesCSV}\n`, handleWriteResult);
    });
}