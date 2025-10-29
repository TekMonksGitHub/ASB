/* 
 * simple.js - Simple garbage collector
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

exports.start = (_routeName, _simple, _messageContainer, message) => {
    ASBLOG.info(`[GC_SIMPLE] Trashed message with timestamp: ${message.timestamp}`);
}