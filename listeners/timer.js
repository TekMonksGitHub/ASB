/* 
 * timer.js, Starts the flow according to the timer schedule
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const CronJob = require("cron").CronJob;

exports.start = (routeName, timer, messageContainer, _message) => {
    if (timer.flow.env[routeName] && timer.flow.env[routeName].alreadyCalled) return;
    else timer.flow.env[routeName] = {"alreadyCalled":true};

    LOG.debug(`[CRONLISTENER] Cron pattern: ${timer.cron}`);
    
    const cronJob = new CronJob(timer.cron, _ => {
        if (timer.flow.fatalError) {cronJob.stop(); return;}  // disabled

        const message = MESSAGE_FACTORY.newMessage();
        message.addRouteDone(routeName);
        messageContainer.add(message);
        LOG.info(`[CRONLISTENER] Injected message with timestamp: ${message.timestamp}`);
    }, null, true);
}