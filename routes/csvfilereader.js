/* 
 * csvreader.js, CSV reader - To convert CSV file to JSON messages
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const LineByLineReader = require('line-by-line');
const messageFactory = require(CONSTANTS.LIBDIR+"/messageFactory.js");

exports.start = (routeName, csvfilereader, messageContainer, message) => {
    if (message.csvfilereader && message.csvfilereader.ignorecall) return;
    if (!message.csvfilereader) message.csvfilereader = {};
    message.csvfilereader.ignorecall = true;        // we are reading the file now

    LOG.info(`[CSVFILEREADER] Processing CSV file: ${message.content.path}`);
    
    if (message.csvfilereader.lr) message.csvfilereader.lr.resume(); 
    else {
        message.csvfilereader.linesRead = 0;

        let csvlines = [];
        let linesRead = 0;
        message.csvfilereader.lr = new LineByLineReader(message.content.path);

        message.csvfilereader.lr.on("error", err => {
            LOG.error(`[CSVFILEREADER] Giving up, error processing file ${message.content.path}: ${err}`);
            LOG.error(`[CSVFILEREADER] Lines read before error = ${linesRead}`);
            messageContainer.remove(message);
            message.csvfilereader.lr.close();
            message.csvfilereader.lr.end();
        });

        message.csvfilereader.lr.on("line", line => {
            linesRead++;
            if ((linesRead == 1) && (csvfilereader.skip_first_row)) return;
            
            csvlines.push(line);
            if (csvlines.length == csvfilereader.rowsPerParse) {
                message.csvfilereader.lr.pause();
                injectMessages(csvlines, routeName, messageContainer);
                csvlines = [];
                message.csvfilereader.ignorecall = false;           // read next chunk on next call
            }
        });

        message.csvfilereader.lr.on("end", _ => {
            injectMessages(csvlines, routeName, messageContainer);   // the leftover lines
            LOG.info(`[CSVFILEREADER] Done processing file ${message.content.path}, lines read = ${linesRead}`);
            messageContainer.remove(message)
        });
    }
}

function injectMessages(lines, routeName, messageContainer) {
    LOG.info(`[CSVFILEREADER] Injecting ${lines.length} new messages`);
    lines.forEach(line => {
        let message = messageFactory.newMessage();
        message.content.csv = line;
        message.addRouteDone(routeName);
        messageContainer.add(message);
    });
}