/* 
 * console_log.js - Writes the message content to the console
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

exports.start = (routeName, _console_log, _messageContainer, message) => {
    LOG.info(`[CONSOLE_LOG] Processing message with timestamp: ${message.timestamp}`);
    LOG.console(typeof message.content == "object" ? JSON.stringify(message.content) : message.content);
    message.addRouteDone(routeName);
}