/* 
 * js.js - Runs native JS code
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */
const utils = require(`${ASBCONSTANTS.LIBDIR}/utils.js`);

exports.start = (routeName, js, messageContainer, message) => {
    if (message.env[routeName]?.isProcessing) return;
    if (!message.env[routeName]) message.env[routeName] = {isProcessing: true};
    ASBLOG.info(`[ROUTE_JS] Processing message with timestamp: ${message.timestamp}`);

    if (js.module) {
        const jsModule = require(utils.expandProperty(js.module, js.flow, message));
        jsModule.start(routeName, js, messageContainer, message);
    } else {
        try {
            const flow = js.flow; // allows JS code below to call the flow.
            eval(js.js);
            if (!js.isAsync) message.addRouteDone(routeName);
        } catch (e) {
            ASBLOG.error(`[ROUTE_JS] Error in computing: ${e}, dropping this message`);
            ASBLOG.error(`[ROUTE_JS] Dropping: ${JSON.stringify(message)}`);
            message.addRouteError(routeName);
        }
    }
}