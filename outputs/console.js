/* 
 * console.js - Output message content to the console
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const console_log = require(`${CONSTANTS.ROOTDIR}/routes/console_log.js`);

exports.start = (routeName, console, messageContainer, message) => {
    console_log.start(routeName, console, messageContainer, message);
}