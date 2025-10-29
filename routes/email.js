/* 
 * email.js - Sends an email via SMTP
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */
const crypt = require(`${CONSTANTS.LIBDIR}/crypt.js`);
const mailer = require(`${CONSTANTS.LIBDIR}/mailer.js`);

exports.start = async (routeName, email, _messageContainer, message) => {
    if (message.env[routeName]?.isProcessing) return;
    if (!message.env[routeName]) message.env[routeName] = {isProcessing: true};
    message.setGCEligible(false);

    // transfer email and email routing data, if specified, from the message content
    email.to = message.content.to || email.to; email.from = message.content.from || email.from;
    email.title = message.content.title || email.title; email.html = message.content.html; email.text = message.content.text;
    email.attachments = email.attachments || []; if (message.content.attachments) for (const attachment of message.content.attachments) email.attachments.push(attachment);

    ASBLOG.info(`[EMAIL] Emailing ${email.to}, from ${email.from} with incoming message with timestamp: ${message.timestamp}`);

    if (!email.port) email.port = (email.secure?587:25);           // handle ports

    const result = await mailer.email(email.to, email.from, email.title, 
        email.html, email.text, email.attachments, { user: email.user, 
            pass: crypt.decrypt(email.password), server: email.host, port: email.port, secure: email.secure });

    if (result.result) {
        message.addRouteDone(routeName);
        delete message.env[routeName];  // clean up our mess
        message.setGCEligible(true);
        message.content = result.response;
        ASBLOG.info(`[EMAIL] Email sent for message with timestamp: ${message.timestamp}`);
        ASBLOG.debug(`[EMAIL] Response data is: ${result.response}`);
    } else {
        ASBLOG.error(`[EMAIL] Email failed with error: ${result.error}, for message with timestamp: ${message.timestamp}`);
        message.addRouteError(routeName);
        delete message.env[routeName];  // clean up our mess
        message.setGCEligible(true);
    }
}