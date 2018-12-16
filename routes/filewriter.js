/* 
 * filewriter.js - Write the message to a file. Can append or overwrite. 
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const FileWriter = require(`${CONSTANTS.LIBDIR}/FileWriter.js`)

exports.start = (routeName, filewriter, _messageContainer, message) => {
    if (message.env[routeName] && message.env[routeName].isBeingProcessed) return;    // already working on it.
    if (!message.env[routeName]) message.env[routeName] = {}; message.env[routeName].isBeingProcessed = true;
    message.setGCEligible(false);

    let output = (message.content instanceof Object ? JSON.stringify(message.content, null, filewriter.prettyJSON) :
        message.content);
    if (message.content instanceof Object && filewriter.write_ndjson) output += "\n";   // ndjson format

    let fw; let flow = filewriter.flow;
    if (flow.env[routeName] && flow.env[routeName][filewriter.path]) fw = flow.env[routeName][filewriter.path];
    else {
        fw = FileWriter.createFileWriter(filewriter.path, filewriter.writeCloseTimeout || 5000, 
            filewriter.encoding || "utf8", !filewriter.append);
        
        if (!flow.env[routeName]) flow.env[routeName] = {};
        flow.env[routeName][filewriter.path] = fw;
    }
    
    fw.writeFile(output, e => {
        let routeFlagger = "addRouteDone";
        if (e) {Log.error(`[FILEWRITER] Write error: ${e}`); routeFlagger = "addRouteError"}
        delete message.env[routeName];      // clean up our stuff
        message[routeFlagger](routeName);   // done or error
        message.setGCEligible(true);        // can collect it now
    });
}
