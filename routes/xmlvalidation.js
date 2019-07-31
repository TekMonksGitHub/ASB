/* 
 * xmlvalidation.js, XML Validation - To validate XML with XSD
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const path = require('path');
const rootdir = path.resolve(__dirname + '/../');
const logFile = require(rootdir + '/custom/createLog');
const utils = require(rootdir + '/lib/utils');
const libxmljs = require('libxmljs');
const fs = require('fs');

exports.start = (routeName, xmlvalidation, messageContainer, message) => {
    if (message.env[routeName] && message.env[routeName].isBeingProcessed) return; // already working on it.
    if (!message.env[routeName]) message.env[routeName] = {};
    message.env[routeName].isBeingProcessed = true;
    message.setGCEligible(false);

    LOG.debug('[XMLVALIDATION_WITH_PARSING] Called for XML message: ' + message.content);

    let handleError = error => {
        message.env.log_message = {
            time: utils.getDateTime(),
            status: '[FINISH-ERROR]',
            code: 'E-X01',
            subject: `Validation Failed`,
            message: error.message,
            fileName: path.basename(message.env.filepath)
        };
        logFile.start(routeName, xmlvalidation, messageContainer, message);
        // LOG.error(`${message.env.log_message}`);
        message.addRouteError(routeName);
        message.setGCEligible(true);
    }

    fs.readFile(xmlvalidation.xsdPath, 'utf-8', (err, data) => {
        if (err) { LOG.error(`Error: ${err}`); return; }
        try {

            let idoc = libxmljs.parseXml(message.content);
            let xsd = libxmljs.parseXml(data);
            let isValid = idoc.validate(xsd);
            if (isValid) {
                message.env.log_message = {
                    time: utils.getDateTime(),
                    status: '[START]',
                    code: 'S-X01',
                    subject: 'Validation Message',
                    message: ` validated successfully.`,
                    fileName: path.basename(message.env.filepath)
                };
                message.content = idoc;
                logFile.start(routeName, xmlvalidation, messageContainer, message);
                LOG.info(`${path.basename(message.env.filepath)} validated successfully`);
                message.addRouteDone(routeName);
                message.setGCEligible(true);
                delete message.env[routeName].isBeingProcessed; // clean our garbage
            }else handleError(idoc.validationErrors[0]);
        } catch (error) {handleError(error);}
    });
}