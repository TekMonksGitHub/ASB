/* 
 * js.js, JS listener - supports custom listeners
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const messageFactory = require(CONSTANTS.LIBDIR+"/messageFactory.js");

exports.start = (routeName, listener, messageContainer, _message) => {
    require(listener.module).start(routeName, listener, messageContainer, messageFactory);
}