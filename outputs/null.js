/* 
 * null.js - Null output
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

exports.start = (routeName, _output, _messageContainer, message) => {
    ASBLOG.info(`[OUTPUT_NULL] Processing message with timestamp: ${message.timestamp}`);
    message.addRouteDone(routeName);
}