/* 
 * filewriter.js - Write the message to a file. Can append or overwrite. 
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const FastFileWriter = require(`${CONSTANTS.LIBDIR}/FileWriter.js`)

exports.start = (routeName, filewriter, messageContainer, message) => {
    if (message.env[routeName] && message.env[routeName].isBeingProcessed) return;    // already working on it.
    if (!message.env[routeName]) message.env[routeName] = {}; message.env[routeName].isBeingProcessed = true;
    message.setGCEligible(false);

    ASBLOG.info("[FILEWRITER] Processing message with timestamp: "+message.timestamp);

    if (filewriter.interceptor_module) require(filewriter.interceptor_module).start(routeName, filewriter, messageContainer, message);
    if (filewriter.interceptor_js) new Function(["require", "routeName", "filewriter", "messageContainer", "message"], 
        filewriter.interceptor_js)(require, routeName, filewriter, messageContainer, message);

    let output = (message.content instanceof Object ? JSON.stringify(message.content, null, filewriter.prettyJSON) :
        message.content);
    if (message.content instanceof Object && filewriter.write_ndjson) output += "\n";   // ndjson format

    let fw; let flow = filewriter.flow;
    if (flow.env[routeName] && flow.env[routeName][filewriter.path]) fw = flow.env[routeName][filewriter.path];
    else {
        fw = FastFileWriter.createFileWriter(filewriter.path, filewriter.writeCloseTimeout || 5000, 
            filewriter.encoding || "utf8", !filewriter.append);
        
        if (!flow.env[routeName]) flow.env[routeName] = {};
        flow.env[routeName][filewriter.path] = fw;
    }
    
    ASBLOG.debug(`[FILEWRITER] Writing to file: ${fw.path}, record is: ${output}`);
    fw.writeFile(output, e => {
        let routeFlagger = "addRouteDone";
        if (e) {ASBLOG.error(`[FILEWRITER] Write error: ${e}`); routeFlagger = "addRouteError"}
        delete message.env[routeName];      // clean up our stuff
        message[routeFlagger](routeName);   // done or error
        message.setGCEligible(true);        // can collect it now
    });
}
