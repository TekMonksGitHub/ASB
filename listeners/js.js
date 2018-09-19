/* 
 * js.js, JS listener - supports custom listeners
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

exports.start = (routeName, listener, messageContainer, _message) => {
    if (listener.module) {require(listener.module).start(routeName, output, messageContainer, message);} else {
        try {
            eval(listener.js);
            if (!js.isAsync) message.addRouteDone(routeName);
        } catch (e) {
            LOG.error(`[LISTENER_JS] Error in computing: ${e}, dropping this message`);
            LOG.error(`[LISTENER_JS] Dropping: ${JSON.stringify(message)}`);
            message.addRouteError(routeName);
        }
    }
}