/* 
 * js.js - Runs native JS code
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const utils = require(`${ASBCONSTANTS.LIBDIR}/utils.js`);

exports.start = (routeName, js, messageContainer, message) => {
    if (message.env[routeName]?.isProcessing) return;
    if (!message.env[routeName]) message.env[routeName] = {isProcessing: true}; message.setGCEligible(false);
    ASBLOG.info(`[ROUTE_JS] ${routeName}: Processing message with timestamp: ${message.timestamp}`);

    const handleError = e => {
        ASBLOG.error(`[ROUTE_JS] ${routeName}: Error in computing: ${e}, dropping this message`);
        ASBLOG.error(`[ROUTE_JS] ${routeName}: Dropping: ${JSON.stringify(message)}`);
        delete message.env[routeName]; 
        if (!message.popRouteStampManuallyModified()) message.addRouteError(routeName); 
        message.setGCEligible(true);
    }

    try {
        if (js.module) {
            const jsModule = require(utils.expandProperty(js.module, js.flow, message));
            jsModule.start(routeName, js, messageContainer, message);
        } else {
            if (js.isAsync) {
                const functionAsync = utils.createAsyncFunction(js.js);
                functionAsync({flow: js.flow, routeName, js, messageContainer, message}).then(
                    _result => {
                        delete message.env[routeName];  // clean up our mess
                        if (!message.popRouteStampManuallyModified()) message.addRouteDone(routeName); 
                        message.setGCEligible(true);
                    },
                    error => handleError(error)
                );
            } else {
                const functionSync = utils.createSyncFunction(js.js);
                functionSync({flow: js.flow, routeName, js, messageContainer, message}); 
                delete message.env[routeName];  // clean up our mess
                if (!message.popRouteStampManuallyModified()) message.addRouteDone(routeName);
                message.setGCEligible(true);
            }
        }
    }  catch (e) {handleError(e);}
}