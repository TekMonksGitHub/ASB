/* 
 * xmlparser.js, CSV reader - To convert XML to JSON messages
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const fast_xml = require("fast-xml-parser"); 

exports.start = (routeName, _xmlparser, _messageContainer, message) => {
    LOG.debug("[XMLPARSER] Called for XML message: "+message.content);

    try {
        const results = fast_xml.parse(message.content);
        message.content = results;
        message.addRouteDone(routeName);

        LOG.info(`[XMLPARSER] Parsed message with timestamp: ${message.timestamp}`);
    } catch (e) {
        LOG.error(`[XMLPARSER] Error parsing XML: ${e}`);
        message.addRouteError(routeName);
    }
}