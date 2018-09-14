/* 
 * js.js, JS listener - supports custom listeners
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

exports.start = (routeName, listener, messageContainer, _message) => {
    require(listener.module).start(routeName, listener, messageContainer);
}