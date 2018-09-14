/* 
 * branch.js - Splits messages, enables branching the flow
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

exports.start = (_routeName, branch, messageContainer, message) => {
    messageContainer.remove(message);

    branch.outputs.forEach(output => {
        let clone = message.clone();
        clone.addRouteDone(output);

        // add in any custom message properties as a shallow clone, best we can do
        Object.keys(message).forEach(k => {
            if (!Object.keys(clone).includes(k)) clone[k] = message[k];
        });

        messageContainer.add(clone);
    });

    LOG.info(`[BRANCH] Created outputs ${branch.outputs}`);
}