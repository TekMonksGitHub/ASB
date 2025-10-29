/* 
 * console_ASBLOG.js - Writes the message content to the console
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

exports.start = (routeName, _console_log, _messageContainer, message) => {
    ASBLOG.info(`[CONSOLE_LOG] Processing message with timestamp: ${message.timestamp}`);
    ASBLOG.console(typeof message.content == "object" ? JSON.stringify(message.content) : message.content);
    message.addRouteDone(routeName);
}