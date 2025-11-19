/** 
 * inproc_listener.js, In-process listener. Useful for software that embeds
 * the ASB inside the same process. Property needed in flow definition is id.
 * ID must be unique for each flow.
 * 
 * Usage: 
 * First ensure the flow which embeds this listener is running. Then
 *  const inproc_listener = require("path_to_listener/inproc_listener.js"); 
 *  inproc_listener.inject(id, {messageContent: message_content, responseReceiver:response_receiver_function});
 * 
 * (C) 2025 TekMonks. All rights reserved.
 */

const IN_PROC_MB = "inproc_mb"; 

const ESB_INPROC_BB = global.ESB.env[IN_PROC_MB] || {
    subscribers: [],
    publish: message => {for (const subscriber of ESB_INPROC_BB.subscribers) subscriber.onmessage(message)},
    subscribe: subscriber => ESB_INPROC_BB.subscribers.push(subscriber)
};
global.ESB.env[IN_PROC_MB] = global.ESB.env[IN_PROC_MB] || ESB_INPROC_BB;

exports.start = (routeName, listener, messageContainer) => {
    if (listener.flow.env[routeName]) return;   // already listening
    else {
        ESB_INPROC_BB.subscribe({onmessage: idmessage => {
            if (idmessage.id != listener.id) return;  // not for us
            const {messageContent, responseReceiver} = idmessage.content;
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
        }});
        listener.flow.env[routeName] = true;
    }
}

exports.inject = (id, content) => ESB_INPROC_BB.publish({id, content});