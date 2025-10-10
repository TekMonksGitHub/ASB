/** 
 * imap.js, IMAP email listener - if email which passes the search criteria is found, it creates a new message.
 * 
 * Needs the NPM imapflow
 * 
 * (C) 2023 TekMonks. All rights reserved.
 */

const {ImapFlow} = require("imapflow");
const asbutils = require(`${ASB_CONSTANTS.LIBDIR}/utils.js`);

const DEFAULT_MAX_MESSAGES_TO_FETCH = 10, DEFAULT_MAX_EMAIL_SIZE = 30*1024*1024;   // 30 MB max email size by default

exports.start = async (routeName, imapnode, messageContainer, _message) => {
    if (imapnode.flow.env[routeName] && imapnode.flow.env[routeName].busy) return;  // we are busy processing

    LOG.debug(`[IMAP_LISTENER] Watching mailbox ${imapnode.mailbox||"INBOX"} for the user ${imapnode.user}.`);

    imapnode.flow.env[routeName] = {"busy":true};

    let imapClient, imap_mailbox_lock, isConnected = false;
    try {
        imapClient = new ImapFlow({host: imapnode.host, port: imapnode.port, secure: imapnode.tls,
            auth: {user: imapnode.user, pass: imapnode.password}});
        await imapClient.connect(); isConnected = true;
        imap_mailbox_lock = await imapClient.getMailboxLock(imapnode.mailbox || "INBOX");

        const emailsUnread = []; for await (const emailUnread of imapClient.fetch({seen: false}, 
                {envelope: true, uid: true, size: true, headers: true, bodyStructure: true})) {
            emailsUnread.push(emailUnread);
            LOG.info(`[IMAP_LISTENER] Found unread email - ${JSON.stringify(emailUnread.envelope)}`);
        }
        if (!emailsUnread.length) LOG.info(`[IMAP_LISTENER] Found no unread emails for mailbox ${imapnode.mailbox||"INBOX"} for the user ${imapnode.user}.`)

        const emailsToFetch = []; for (const [i, emailUnread] of emailsUnread.entries()) {
            if (i >= (imapnode.maxmessages||DEFAULT_MAX_MESSAGES_TO_FETCH)) break;
            if (emailUnread.size <= (imapnode.maxEmailSize||DEFAULT_MAX_EMAIL_SIZE)) emailsToFetch.push(emailUnread);
            LOG.info(`"[IMAP_LISTENER] Email matching filtering criteria - ${JSON.stringify(emailUnread.envelope)}`);
        } 

        for (const emailToInject of emailsToFetch) {
            const partsToDownload = _getParts(emailToInject.bodyStructure.childNodes);
            const fullEmail = await imapClient.downloadMany(emailToInject.seq, Object.keys(partsToDownload));
            if (!fullEmail) throw new Error(`Unable to download the message ${JSON.stringify(emailUnread.envelope)}`);
        
            const message = MESSAGE_FACTORY.newMessageAllocSafe();
            if (!message) throw new Error(`Unable to create a new message to inject.`);
            if (imapnode.partsToInject.includes("envelope")) message.content.envelope = asbutils.clone(emailToInject.envelope);
            for (const [key, part] of Object.entries(fullEmail)) {
                if (!_isAttachment(part)) { // extract email texts 
                    if (part.meta.contentType.toLowerCase() == "text/html" && imapnode.partsToInject.includes("html"))
                        message.content.htmls = [part.content.toString('utf8'), ...(message.content.htmls||[])];
                    if (part.meta.contentType.toLowerCase() == "text/plain" && imapnode.partsToInject.includes("text"))
                        message.content.texts = [part.content.toString('utf8'), ...(message.content.texts||[])];
                } else if (imapnode.partsToInject.includes("attachments")) {    // extract email attachments
                    const attachmentThisPart = {contentType: part.meta.contentType, filename: part.meta.filename, 
                        data: Buffer.from(part.content).toString("base64"), 
                        _imap_part_size: partsToDownload[key].size, encoding: "base64"};
                    message.content.attachments = [attachmentThisPart, ...(message.content.attachments||[])];
                }
            }
            message.addRouteDone(routeName);
            messageContainer.add(message);
            await imapClient.messageFlagsAdd(emailToInject.seq, ["\\Seen"]);
            LOG.info(`[IMAP_LISTENER] Injected message with timestamp: ${message.timestamp}`); 
        }
    } catch (err) {
        LOG.error(`[IMAP_LISTENER] IMAP server error for node ${routeName}, the error is ${JSON.stringify(err)}`)
    } finally { if (imap_mailbox_lock) imap_mailbox_lock.release(); if (isConnected && imapClient) await imapClient.logout();}

    imapnode.flow.env[routeName] = {"busy":false};
}

function _getParts(childNodes, arraySoFar={}) {
    for (const childNode of childNodes) {
        if (childNode.childNodes) _getParts(childNode.childNodes, arraySoFar)
        else arraySoFar[childNode.part] = {size: childNode.size};
    }

    return arraySoFar;
}

const _isAttachment = part => (part.meta.disposition?.toLowerCase() == "attachment") || (part.meta.filename);