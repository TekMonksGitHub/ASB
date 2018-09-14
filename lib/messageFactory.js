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
        this.content = {};
    }
    addRouteDone(routeName) {this.routesDone.push(routeName)}
    clone() {
        let clone = new Message();
        clone.timestamp = this.timestamp;
        clone.routesDone = this.routesDone.slice(0);
        clone.content = JSON.parse(JSON.stringify(this.content));
        return clone;
    }
};

exports.newMessage = _ => {return new Message();}