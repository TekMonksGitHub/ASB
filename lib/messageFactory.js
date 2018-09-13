/* 
 * messageFactory.js, ESB Message factory
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const utils = require(CONSTANTS.LIBDIR+"/utils.js");

class Message {
    constructor() {
        this.timestamp = utils.getTimeStamp();
        this.routesDone = [];
    }
    addRouteDone(routeName) {this.routesDone.push(routeName)}
};

exports.newMessage = _ => {return new Message();}