/* 
 * js.js - Runs native JS code
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const utils = require(`${ASBCONSTANTS.LIBDIR}/utils.js`);

exports.start = (routeName, output, messageContainer, message) => {
    if (message.env[routeName]?.isProcessing) return;
    if (!message.env[routeName]) message.env[routeName] = {isProcessing: true}; message.setGCEligible(false);
    ASBLOG.info(`[OUTPUT_JS] Processing message with timestamp: ${message.timestamp}`);
    
    const handleError = e => {
        ASBLOG.error(`[ROUTE_JS] Error in computing: ${e}, dropping this message`);
        ASBLOG.error(`[ROUTE_JS] Dropping: ${JSON.stringify(message)}`);
        delete message.env[routeName]; 
        if (!message.popRouteStampManuallyModified()) message.addRouteError(routeName); 
        message.setGCEligible(true);
    }

    try {
        if (output.module) {
            const jsModule = require(utils.expandProperty(output.module, output.flow, message));
            jsModule.start(routeName, output, messageContainer, message);
        } else {
            if (js.isAsync) {
                const functionAsync = utils.createAsyncFunction(output.js);
                functionAsync({flow: output.flow, routeName, output, messageContainer, message}).then(
                    _result => {
                        delete message.env[routeName]; 
                        if (!message.popRouteStampManuallyModified()) message.addRouteDone(routeName); 
                        message.setGCEligible(true);
                    },
                    error => handleError(error)
                );
            } else {
                const functionSync = utils.createSyncFunction(js.js);
                functionSync({flow: output.flow, routeName, output, messageContainer, message}); 
                delete message.env[routeName]; 
                if (!message.popRouteStampManuallyModified()) message.addRouteDone(routeName);
                message.setGCEligible(true);
            }
        }
    }  catch (e) {handleError(e);}
}