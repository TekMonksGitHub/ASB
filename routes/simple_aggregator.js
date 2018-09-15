/* 
 * simple_aggregator.js, Aggregates messages, very simople, just merges content keys
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

exports.start = (routeName, simple_aggregator, messageContainer, message) => {
    LOG.info(`[SIMPLE_AGGREGATOR] Called with message timestamp: ${message.timestamp}`);

    if (!simple_aggregator.flow.env.out) simple_aggregator.flow.env.out = MESSAGE_FACTORY.newMessage();
    if (!simple_aggregator.flow.env.aggregator_count) simple_aggregator.flow.env.aggregator_count = 0;

    // aggregate message content
    Object.keys(message.content).forEach(k => simple_aggregator.flow.env.out.content[k] = message.content[k]);
    
    // add in any custom message properties as a shallow clone, best we can do
    Object.keys(message).forEach(k => {
        if (!Object.keys(simple_aggregator.flow.env.out).includes(k)) simple_aggregator.flow.env.out[k] = message[k];
    });

    simple_aggregator.flow.env.aggregator_count++;

    messageContainer.remove(message);       // we've aggregated it, clean up

    if (simple_aggregator.flow.env.aggregator_count == simple_aggregator.dependencies.length) {
        LOG.info("[SIMPLE_AGGREGATOR] Done aggregating.");
        simple_aggregator.flow.env.out.addRouteDone(routeName);
        messageContainer.add(simple_aggregator.flow.env.out);
        
        simple_aggregator.flow.env.out = null;     // release memory, we are done!
        delete simple_aggregator.flow.env.aggregator_count;
    }
}