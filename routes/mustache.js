/* 
 * mustache.js, Mustache parser - convert JSON into templated documents
 *              Reads the template specified at the flow level so that new
 *              messages don't cause the ESB to re-read the templates again
 * 
 * (C) 2020 TekMonks. All rights reserved.
 */

const fs = require("fs");
const hairyone = require("mustache"); 

exports.start = (routeName, mustache, _messageContainer, message) => {
    if (mustache.flow.env.mustache && mustache.flow.env.mustache[mustache.template] && mustache.flow.env.mustache[mustache.template].ignorecall) return;
    if (!mustache.flow.env.mustache || !mustache.flow.env.mustache[mustache.template]) {    // template not read yet
        mustache.flow.env.mustache = mustache.flow.env.mustache || {};
        mustache.flow.env.mustache[mustache.template] = {ignorecall: true};    // we are reading the template now
        message.setGCEligible(false);                       // we are not done
        fs.readFile(mustache.template, {encoding: "utf-8"}, (err, data) => {
            if (err) {
                ASBLOG.error(`[MUSTACHE] Error reading template: ${e}`);
                ASBLOG.error("[MUSTACHE] Disabling the flow.");
                mustache.flow.fatalError = true;
                delete mustache.flow.env.mustache[mustache.template];
                message.addRouteError(routeName);
                message.setGCEligible(true);  
            } else {
                delete mustache.flow.env.mustache[mustache.template].ignorecall;
                mustache.flow.env.mustache[mustache.template] = data;
            }
        });
        return;
    }

    ASBLOG.debug("[MUSTACHE] Called for message: "+message.content);

    try {
        const results = hairyone.render(mustache.flow.env.mustache[mustache.template], message.content);
        message.content = results;
        message.setGCEligible(true);
        message.addRouteDone(routeName);

        ASBLOG.info(`[MUSTACHE] Parsed message with timestamp: ${message.timestamp}`);
    } catch (e) {
        ASBLOG.error(`[MUSTACHE] Error parsing: ${e}`);
        message.addRouteError(routeName);
    }
}