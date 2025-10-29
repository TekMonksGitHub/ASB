/* 
 * csvwriter.js - Convert JSON to CSV and write to a file
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const fs = require("fs");
const papa = require("papaparse"); 
const filewriter = require(`${CONSTANTS.LIBDIR}/FileWriter.js`);

exports.start = (routeName, csvwriter, _messageContainer, message) => {
    if (message.env[routeName] && message.env[routeName].isBeingProcessed) return;    // already working on it.
    if (!message.env[routeName]) message.env[routeName] = {}; message.env[routeName].isBeingProcessed = true;
    message.setGCEligible(false);
    ASBLOG.debug(`[CSVWRITER] Processing message with timestamp: ${message.timestamp}`);

    let handleError = e => {
        ASBLOG.error(`[CSVWRITER] ${e}`); message.addRouteError(routeName); message.setGCEligible(true); return;}

    const keys = Object.keys(message.content);

    // sanity tests
    if (!message.content) {handleError("No content. Skipping."); return;}
    if (csvwriter.headers && (keys.length != csvwriter.headers.length)) 
        {handleError("Header / Data mismatch. Check specified headers."); return;}

    // let convert...
    let values = []; keys.forEach(k => values.push(message.content[k]));
    const headersCSV = (csvwriter.headers?papa.unparse([csvwriter.headers]):papa.unparse([keys]));
    const valuesCSV = papa.unparse([values]);
    
    // write it out
    if (!csvwriter.flow.env[routeName]) csvwriter.flow.env[routeName] = {};
    if (!csvwriter.flow.env[routeName][`filewriter_${csvwriter.path}`])
        csvwriter.flow.env[routeName][`filewriter_${csvwriter.path}`] = 
            filewriter.createFileWriter(csvwriter.path, csvwriter.timeout || 5000, csvwriter.encoding || "utf8");
    const fwriter = csvwriter.flow.env[routeName][`filewriter_${csvwriter.path}`];

    const handleWriteResult = e => { if (e) handleError(`Write error: ${e}`); else {
        message.addRouteDone(routeName);
        message.setGCEligible(true);
        delete message.env[routeName].isBeingProcessed; // clean our garbage
    } }
    if (!csvwriter.flow.env[routeName].headersWritten) fs.access(csvwriter.path, fs.constants.F_OK, error => {
        if (!error) fwriter.writeFile(`${valuesCSV}\n`, handleWriteResult);
        else if (!csvwriter.flow.env[routeName].headersWritten) fwriter.writeFile(`${headersCSV}\n${valuesCSV}\n`, handleWriteResult);
        csvwriter.flow.env[routeName].headersWritten = true;
    }); else fwriter.writeFile(`${headersCSV}\n${valuesCSV}\n`, handleWriteResult);
}