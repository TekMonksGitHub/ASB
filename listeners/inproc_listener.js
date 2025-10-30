/** 
 * inproc_listener.js, In-process listener. Useful for software that embeds
 * the ASB inside the same process. 
 * 
 * Usage: 
 * First ensure the flow which embeds this listener is running. Then
 *  const inproc_listener = require("path_to_listener/inproc_listener.js"); 
 *  inproc_listener.inject(message_content, response_receiver_function);
 * 
 * (C) 2025 TekMonks. All rights reserved.
 */

let _injector;

exports.start = (routeName, listener, messageContainer) => {
    if (listener.flow.env[routeName]) return;   // already listening
    else {
        _injector = (messageContent, responseReceiver) => { // create our message injector
            const message = MESSAGE_FACTORY.newMessageAllocSafe();
            if (!message) {
                ASBLOG.error("[INPROC_LISTENER] Message creation error, throttling listener."); 
                return false;
            } else {
                message.content = messageContent;
                message.responseReceiver = responseReceiver;
                message.addRouteDone(routeName);
                messageContainer.add(message);
                ASBLOG.info(`[INPROC_LISTENER] Injected new message with timestamp: ${message.timestamp}`);
                return true;
            }
        }
        listener.flow.env[routeName] = true;
    }
}

exports.injector = injector;