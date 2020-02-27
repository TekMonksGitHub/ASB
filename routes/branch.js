/* 
 * branch.js - Splits messages, enables branching the flow
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

exports.start = (routeName, branch, messageContainer, message) => {
    message.addRouteDone(routeName);

    branch.outputs.forEach(output => {
        const clone = message.clone();
        clone.addRouteDone(output);

        messageContainer.add(clone);
    });

    LOG.info(`[BRANCH] Created outputs ${branch.outputs}`);
}