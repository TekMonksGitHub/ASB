/* 
* messageFactory.js, ESB Message factory
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const utils = require(CONSTANTS.LIBDIR+"/utils.js");
const EventEmitter = require('events');
class MyEmitter extends EventEmitter {}
const gcListener = new MyEmitter();
gcListener.on("gc_message",(messageSize)=>{ESB.env.totalMemory-=messageSize/1000000;});

class Message {
    constructor() {
        this.timestamp = utils.getTimeStamp();
        this.routesDone = [];
        this.content = {};
        this.env = {};
        this.isGCEligible = true;
    }
    addRouteDone(routeName) {this.routesDone.push(routeName); this.isGCEligible = true;}
    addRouteError(routeName) {this.routesDone.push(`${routeName}.error`); this.isGCEligible = true;}
    setGCEligible(eligible) {this.isGCEligible = eligible}
    addEmitGCListener(messageSize) {gcListener.emit("gc_message",messageSize)}
    clone() {
        let clone = new Message();
        clone.timestamp = this.timestamp;
        clone.routesDone = this.routesDone.slice(0);
        clone.content = Object.assign(clone.content, this.content);
        clone.env = Object.assign(clone.env, this.env);

        return clone;
    }
};

exports.newMessage = _ => {return new Message();}