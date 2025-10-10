/* 
 * ediparser.js, EDI reader - To convert EDI to JSON messages
 * 
 * (C) 2020 TekMonks. All rights reserved.
 */

const {spawn} = require("child_process"); 

exports.start = (routeName, ediparser, _messageContainer, message) => {
    if (message.env[routeName] && message.env[routeName].ignorecall) return;
    if (!message.env[routeName]) message.env[routeName] = {};
    message.env[routeName].ignorecall = true;           // we are parsing the message now
    message.setGCEligible(false);                       // we are not done

    LOG.debug(`[EDIPARSER] Called for EDI message: ${message.content}`);

    const extediparser = spawn(ediparser.java, ["-jar", `${ASB_CONSTANTS.LIBDIR}/3p/ediconv.jar`]);
    let results = ""; let error = ""; hadError = false;

    extediparser.stdout.on("data", data => results += data);
    extediparser.stderr.on("data", data => {error += data; hadError = true;})
    extediparser.on("close", _code => {
        if (!hadError) try {results = JSON.parse(results);} catch (err) {hadError = true; error = err};
        if (!hadError) {message.content = results; message.addRouteDone(routeName);}
        else {LOG.error(`[EDIPARSER] Failed to parse incoming message: ${error}`); message.addRouteError(routeName);}

        delete message.env[routeName].ignorecall;   // cleanup
        message.setGCEligible(true);
    });
    extediparser.stdin.write(message.content); extediparser.stdin.end(); // send the file contents
}