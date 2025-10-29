/* 
 * csvreader.js, CSV reader - To convert CSV file to JSON messages
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const LineByLineReader = require("line-by-line");
const fs = require("fs");
const path = require("path");
const utils = require(CONSTANTS.LIBDIR+"/utils.js");

exports.start = (routeName, csvfilereader, messageContainer, message) => {
    if (message.env[routeName] && message.env[routeName].ignorecall) return;
    if (!message.env[routeName]) message.env[routeName] = {};
    message.env[routeName].ignorecall = true;           // we are reading the file now
    message.setGCEligible(false);                       // we are not done

    ASBLOG.info(`[CSVFILEREADER] Processing CSV file: ${message.env.filepath}`);
    
    if (message.env[routeName].lr) message.env[routeName].lr.resume(); 
    else {
        let csvlines = [];
        let linesRead = 0;
        message.env[routeName].lr = new LineByLineReader(message.env.filepath);

        message.env[routeName].lr.on("error", err => {
            ASBLOG.error(`[CSVFILEREADER] Giving up, error processing file ${message.env.filepath}: ${err}`);
            ASBLOG.error(`[CSVFILEREADER] Lines read before error = ${linesRead}`);
            message.env[routeName].lr.close();
            message.env[routeName].lr.end();
            message.addRouteError(routeName);
            delete message.env[routeName].ignorecall;   // cleanup
            message.setGCEligible(true);
        });

        message.env[routeName].lr.on("line", line => {
            linesRead++; 
            if ((linesRead == 1) && (csvfilereader.skip_first_row)) return;
            
            csvlines.push(line); 
            if (csvlines.length == csvfilereader.rowsPerParse) {
                message.env[routeName].lr.pause();
                injectMessages(csvlines, message.env.filepath, routeName, messageContainer);
                csvlines = [];
                message.env[routeName].ignorecall = false;           // read next chunk on next call
            }
        });

        message.env[routeName].lr.on("end", _ => {
            injectMessages(csvlines, message.env.filepath, routeName, messageContainer);   // the leftover lines
            ASBLOG.info(`[CSVFILEREADER] Done processing file ${message.env.filepath}, lines read = ${linesRead}`);
            message.addRouteDone(routeName);
            message.setGCEligible(true);

            if (csvfilereader.donePath) try {
                let newPath = `${csvfilereader.donePath}/${path.basename(message.env.filepath)}.${utils.getTimeStamp()}`;
                fs.rename(message.env.filepath, newPath, err => {if (err) ASBLOG.error(`[CSVFILEREADER] Error moving: ${err}`)});
            } catch (e) {ASBLOG.error(`[CSVFILEREADER] Error moving: ${err}`);}
        });
    }
}

function injectMessages(lines, filepath, routeName, messageContainer) {
    ASBLOG.info(`[CSVFILEREADER] Injecting ${lines.length} new messages`);
    lines.forEach(line => {
        let message = MESSAGE_FACTORY.newMessage();
        message.env.filepath = filepath;
        message.content = line;
        message.addRouteDone(routeName);
        messageContainer.add(message);
        ASBLOG.debug(`[CSVFILEREADER] Injected new message with timestamp ${message.timestamp}`);
    });
}