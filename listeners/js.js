/* 
 * js.js, JS listener - supports custom listeners
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const utils = require(`${ASBCONSTANTS.LIBDIR}/utils.js`);

exports.start = (routeName, listener, messageContainer) => {
    if (listener.flow.env[routeName]) return;   // already listening
    else listener.flow.env[routeName] = true;

    if (listener.module) {
        const listenerModule = require(utils.expandProperty(listener.module, listener.flow, message));
        listenerModule.start(routeName, listener, messageContainer);
    } else {
        const functionAsync = utils.createAsyncFunction(listener.js);   // why? because async can run sync as well as async code
        functionAsync({flow: listener.flow, routeName, listener, messageContainer}); // we don't wait either way
    }
}