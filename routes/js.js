/* 
 * js.js - Runs native JS code
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

exports.start = (routeName, js, messageContainer, message) => {
    try {
        eval(js.js);
        message.addRouteDone(routeName);
    } catch (e) {
        LOG.error(`[JS] Error in computing: ${e}, dropping this message`);
        LOG.error(`[JS] Dropping: ${JSON.stringify(message)}`);
        messageContainer.remove(message);
    }
}