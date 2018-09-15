/* 
 * js.js - Runs native JS code
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

exports.start = (routeName, js, messageContainer, message) => {
    if (js.module) {
        require(js.module).start(routeName, js, messageContainer, message);
    } else {
        try {
            eval(js.js);
            message.addRouteDone(routeName);
        } catch (e) {
            LOG.error(`[ROUTE_JS] Error in computing: ${e}, dropping this message`);
            LOG.error(`[ROUTE_JS] Dropping: ${JSON.stringify(message)}`);
            
            messageContainer.remove(message);
        }
    }
}