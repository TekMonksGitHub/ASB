/* 
 * xmlparser.js, CSV reader - To convert XML to JSON messages
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const fast_xml = require("fast-xml-parser"); 

exports.start = (routeName, _xmlparser, _messageContainer, message) => {
    ASBLOG.debug("[XMLPARSER] Called for XML message: "+message.content);

    try {
        const results = (new fast_xml.XMLParser()).parse(message.content);
        message.content = results;
        message.addRouteDone(routeName);

        ASBLOG.info(`[XMLPARSER] Parsed message with timestamp: ${message.timestamp}`);
    } catch (e) {
        ASBLOG.error(`[XMLPARSER] Error parsing XML: ${e}`);
        message.addRouteError(routeName);
    }
}