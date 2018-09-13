/* 
 * simple.js - Simple garbage collector
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

exports.start = (routeName, simple, messageContainer, message) => {
    LOG.info(`[GC_SIMPLE] Trashed message with timestamp: ${message.timestamp}`);
}