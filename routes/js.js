/* 
 * js.js - Runs native JS code
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

exports.start = (routeName, js, messageContainer, message) => {
    LOG.info(`[ROUTE_JS] Processing message with timestamp: ${message.timestamp}`);

    if (js.module) {require(js.module).start(routeName, js, messageContainer, message);} else {
        try {
            let flow = js.flow; // allows JS code below to call the flow.
            eval(js.js);
            if (!js.isAsync) message.addRouteDone(routeName);
        } catch (e) {
            LOG.error(`[ROUTE_JS] Error in computing: ${e}, dropping this message`);
            LOG.error(`[ROUTE_JS] Dropping: ${JSON.stringify(message)}`);
            message.addRouteError(routeName);
        }
    }
}