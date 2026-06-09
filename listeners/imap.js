/** 
 * imap.js, IMAP email listener - if email which passes the search criteria is found, it creates a new message.
 * 
 * Needs the NPM imapflow
 * 
 * (C) 2023 TekMonks. All rights reserved.
 */

const {ImapFlow} = require("imapflow");
const conf = require(ASBCONSTANTS.IMAPCONF);
const crypt = require(`${ASBCONSTANTS.LIBDIR}/crypt.js`);
const asbutils = require(`${ASBCONSTANTS.LIBDIR}/utils.js`);

const DEFAULT_MAX_MESSAGES_TO_FETCH = 10, DEFAULT_MAX_EMAIL_SIZE = 30*1024*1024;   // 30 MB max email size by default

exports.start = async (routeName, imapnode, messageContainer, _message) => {
    if (imapnode.flow.env[routeName] && imapnode.flow.env[routeName].busy) return;  // we are busy processing

    ASBLOG.debug(`[IMAP_LISTENER] Watching mailbox ${imapnode.mailbox||"INBOX"} for the user ${imapnode.user}.`);

    imapnode.flow.env[routeName] = {"busy":true};

    let imapClient, imap_mailbox_lock, isConnected = false;
    try {
        const imapPassword = crypt.decrypt(imapnode.password); 
        imapClient = new ImapFlow({host: imapnode.host, port: imapnode.port, secure: imapnode.tls,
            socketTimeout: imapnode.socketTimeout || conf.socketTimeout,  // milliseconds of connection inactivity to allow before dropping
            greetingTimeout: imapnode.greetingTimeout || conf.greetingTimeout,  // milliseconds to wait for the initial server greeting after TCP completion
            connectionTimeout: imapnode.connectionTimeout || conf.connectionTimeout,  // milliseconds of overall connection timeout
            auth: { user: imapnode.user, pass: imapPassword }
        });
        await imapClient.connect(); isConnected = true;
        imap_mailbox_lock = await imapClient.getMailboxLock(imapnode.mailbox || "INBOX");

        const emailsUnread = []; for await (const emailUnread of imapClient.fetch({seen: false}, 
                {envelope: true, uid: true, size: true, headers: true, bodyStructure: true})) {
            emailsUnread.push(emailUnread);
            ASBLOG.info(`[IMAP_LISTENER] Found unread email - ${JSON.stringify(emailUnread.envelope)}`);
        }
        if (!emailsUnread.length) ASBLOG.info(`[IMAP_LISTENER] Found no unread emails for mailbox ${imapnode.mailbox||"INBOX"} for the user ${imapnode.user}.`)

        const emailsToFetch = []; for (const [i, emailUnread] of emailsUnread.entries()) {
            if (i >= (imapnode.maxmessages||DEFAULT_MAX_MESSAGES_TO_FETCH)) break;
            if (emailUnread.size <= (imapnode.maxEmailSize||DEFAULT_MAX_EMAIL_SIZE)) emailsToFetch.push(emailUnread);
            ASBLOG.info(`"[IMAP_LISTENER] Email matching filtering criteria - ${JSON.stringify(emailUnread.envelope)}`);
        } 

        const partsToInject = imapnode.partsToInject || [];
        for (const emailToInject of emailsToFetch) {
            const {partsToDownload, fullEmail} = await _downloadEmailParts(imapClient, emailToInject);
            if (!fullEmail || fullEmail.response === false) throw new Error(`Unable to download the message ${JSON.stringify(emailToInject.envelope)}`);
        
            const message = MESSAGE_FACTORY.newMessageAllocSafe();
            if (!message) throw new Error(`Unable to create a new message to inject.`);
            if (partsToInject.includes("envelope")) message.content.envelope = asbutils.clone(emailToInject.envelope);
            for (const [key, part] of Object.entries(fullEmail)) {
                if (!_isAttachment(part)) { // extract email texts 
                    if (part.meta.contentType.toLowerCase() == "text/html" && partsToInject.includes("html"))
                        message.content.htmls = [part.content.toString('utf8'), ...(message.content.htmls||[])];
                    if (part.meta.contentType.toLowerCase() == "text/plain" && partsToInject.includes("text"))
                        message.content.texts = [part.content.toString('utf8'), ...(message.content.texts||[])];
                } else if (partsToInject.includes("attachments")) {    // extract email attachments
                    const attachmentThisPart = {contentType: part.meta.contentType, filename: part.meta.filename, 
                        data: Buffer.from(part.content).toString("base64"), 
                        _imap_part_size: partsToDownload[key].size, encoding: "base64"};
                    message.content.attachments = [attachmentThisPart, ...(message.content.attachments||[])];
                }
            }
            await imapClient.messageFlagsAdd(emailToInject.seq, ["\\Seen"]);
            message.addRouteDone(routeName);
            messageContainer.add(message);
            ASBLOG.info(`[IMAP_LISTENER] Injected message with timestamp: ${message.timestamp}`); 
        }
    } catch (err) {
        ASBLOG.error(`[IMAP_LISTENER] IMAP server error for node ${routeName}, the error is ${err.stack || JSON.stringify(err)}`)
    } finally {
        try {
            if (imap_mailbox_lock) imap_mailbox_lock.release();
            if (isConnected && imapClient) await imapClient.logout();
        } catch (err) {
            ASBLOG.error(`[IMAP_LISTENER] IMAP client logout failed. Trying to close the connection, the error is ${err.stack || JSON.stringify(err)}`);
            try { if (imapClient) imapClient.close(); ASBLOG.info(`[IMAP_LISTENER] IMAP client connection is successfully closed.`);} 
            catch (err) { ASBLOG.error(`[IMAP_LISTENER] IMAP closing client connection failed, the error is ${err.stack || JSON.stringify(err)}`); }
        } 
    }

    imapnode.flow.env[routeName] = {"busy":false};
}

function _getParts(childNodes, arraySoFar={}) {
    for (const childNode of childNodes) {
        if (childNode.childNodes) _getParts(childNode.childNodes, arraySoFar)
        else arraySoFar[childNode.part] = {size: childNode.size};
    }

    return arraySoFar;
}

const _readStream = async stream => {
    const chunks = [];
    for await (const chunk of stream) chunks.push(chunk);
    return Buffer.concat(chunks);
};

/**
 * Download the IMAP body data for one email and normalize the result shape.
 * 
 * Multipart messages are fetched with `downloadMany()` using the flattened
 * body structure parts. Single-part messages fall back to `download("1")`,
 * and the returned stream is converted into a Buffer so the caller can treat
 * both paths the same way.
 *
 * @param {ImapFlow} imapClient The connected IMAP client.
 * @param {Object} emailToInject The fetched message record from `fetch()`.
 * @returns {Object} {partsToDownload: Object, fullEmail: Object}} The part size map
 * and the normalized download result.
 */
const _downloadEmailParts = async (imapClient, emailToInject) => {
    const bodyStructure = emailToInject.bodyStructure || {};
    if (bodyStructure.childNodes && bodyStructure.childNodes.length) {
        const partsToDownload = _getParts(bodyStructure.childNodes);
        return { partsToDownload, fullEmail: await imapClient.downloadMany(emailToInject.seq, Object.keys(partsToDownload)) };
    }

    const partsToDownload = {1: {size: emailToInject.size || 0}};
    const singlePart = await imapClient.download(emailToInject.seq, "1");
    if (!singlePart || singlePart.response == false || !singlePart.content) return {partsToDownload, fullEmail: singlePart};
    return { partsToDownload, fullEmail: {1: {meta: singlePart.meta, content: await _readStream(singlePart.content)}} };
};

const _isAttachment = part => part.meta && (part.meta.disposition?.toLowerCase()=="attachment" || part.meta.filename);