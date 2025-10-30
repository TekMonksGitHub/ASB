/** 
 * inproc_responder.js, In-process responder. Useful for software that embeds
 * the ASB inside the same process. 
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

exports.start = (routeName, _output, _messageContainer, message) => {
    ASBLOG.info(`[INPROC_RESPONDER] Processing message with timestamp: ${message.timestamp}`);
    
    if (message.responseReceiver) {
        message.responseReceiver(message.content);
        message.addRouteDone(routeName);
    } else {
        ASBLOG.error(`[INPROC_RESPONDER] Dropping message with timestamp: ${message.timestamp} due to missing response receiver.`);
        message.addRouteError(routeName);
    }
}