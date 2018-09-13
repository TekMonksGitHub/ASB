/* 
 * messageFactory.js, ESB Message factory
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const utils = require(CONSTANTS.LIBDIR+"/utils.js");

class Message {
    constructor() {
       this[CONSTANTS.MSGCONSTANTS.TIMESTAMP] = utils.getDateTime();
       this[CONSTANTS.MSGCONSTANTS.DEPDONE] = [];
    }
    get nodesDone() {return this[CONSTANTS.MSGCONSTANTS.DEPDONE]}
    addNodeDone(nodeName) {this[CONSTANTS.MSGCONSTANTS.DEPDONE].push(nodeName)}
};

exports.newMessage = _ => {return new Message();}