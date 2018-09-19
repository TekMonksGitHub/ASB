/* 
 * js.js - Runs native JS code
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

exports.start = (routeName, output, messageContainer, message) => {
    if (output.module) {require(output.module).start(routeName, output, messageContainer, message);} else {
        try {
            eval(output.js);
            if (!js.isAsync) message.addRouteDone(routeName);
        } catch (e) {
            LOG.error(`[OUTPUT_JS] Error in computing: ${e}, dropping this message`);
            LOG.error(`[OUTPUT_JS] Dropping: ${JSON.stringify(message)}`);
            message.addRouteError(routeName);
        }
    }
}