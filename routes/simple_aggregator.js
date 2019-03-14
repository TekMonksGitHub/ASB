/* 
 * simple_aggregator.js, Aggregates messages, very simple, just merges content keys
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

exports.start = (routeName, simple_aggregator, messageContainer, message) => {
    LOG.info(`[SIMPLE_AGGREGATOR] Called with message timestamp: ${message.timestamp}`);

    if (!simple_aggregator.flow.env[routeName]) simple_aggregator.flow.env[routeName] = {};
    let env = simple_aggregator.flow.env[routeName];    // define our working environment

    if (!env.out) {env.out = MESSAGE_FACTORY.newMessage(); env.aggregator_count = 0;}

    // aggregate message content, must be enumeratable for this to work
    env.out.content = Object.assign(env.out.content, message.content);
    env.out.env = Object.assign(env.out.env, message.env);

    env.aggregator_count++;

    message.addRouteDone(routeName);       // we've aggregated it

    if (env.aggregator_count == simple_aggregator.dependencies.length) {
        LOG.info("[SIMPLE_AGGREGATOR] Done aggregating.");
        env.out.addRouteDone(routeName);
        messageContainer.add(env.out);
        
        env.out = null;     // release memory, we are done!
        delete env.aggregator_count;
    }
}