/* 
 * js.js, JS listener - supports custom listeners
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

exports.start = (routeName, listener, messageContainer) => {
    const message = MESSAGE_FACTORY.newMessageAllocSafe();
    if (!message) {LOG.error("[JS_LISTENER] Message creation error, throttling listener."); return;}

    if (listener.module) {message.content = require(listener.module).start(routeName, output, messageContainer);} 
    else {message.content = new Function(listener.js)();}

    message.addRouteDone(routeName);
    messageContainer.add(message);
    LOG.info(`[JS_LISTENER] Injected message with timestamp: ${message.timestamp}`); 
}