/** 
 * imap.js, IMAP email listener - if email which passes the search criteria is found, it creates a new message.
 * 
 * Needs the NPM imapflow
 * 
 * (C) 2023 TekMonks. All rights reserved.
 */

const {ImapFlow} = require("imapflow");

exports.start = async (routeName, imapnode, messageContainer, _message) => {
    if (imapnode.flow.env[routeName] && imapnode.flow.env[routeName].busy) return;  // we are busy processing

    LOG.debug(`[IMAP_LISTENER] Watching mailbox ${imapnode.mailbox||"INBOX"} for the user ${imapnode.user}.`);

    imapnode.flow.env[routeName] = {"busy":true};

    const message = MESSAGE_FACTORY.newMessageAllocSafe();
    if (!message) { // we need a message first in case we get an email 
        LOG.error("[IMAP_LISTENER] Message creation error, throttling listener."); 
        imapnode.flow.env[routeName] = {"busy":false};
        return;
    }

    let imapClient, imap_mailbox_lock, isConnected = false;
    try {
        imapClient = new ImapFlow({host: imapnode.host, port: imapnode.port, secure: imapnode.tls,
            auth: {user: imapnode.user, pass: imapnode.password}});
        await imapClient.connect(); isConnected = true;
        imap_mailbox_lock = await imapClient.getMailboxLock(imapnode.mailbox || "INBOX");

        const email = await imapClient.fetchOne(imapClient.mailbox.exists, { envelope: true });
        LOG.info(email.envelope.subject);
            
        message.content = email.envelope.subject;
        message.addRouteDone(routeName);
        messageContainer.add(message);
        LOG.info(`[IMAP_LISTENER] Injected message with timestamp: ${message.timestamp}`); 
    } catch (err) { 
        LOG.error(`[IMAP_LISTENER] IMAP server error for node ${routeName}, the error is ${JSON.stringify(err)}`); 
        message.setGCEligible(true);    // release the message
    }
    finally { if (imap_mailbox_lock) imap_mailbox_lock.release(); if (isConnected && imapClient) await imapClient.logout();}

    imapnode.flow.env[routeName] = {"busy":false};
}