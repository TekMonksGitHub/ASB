/* 
 * messageFactory.js, ESB Message factory
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const utils = require(CONSTANTS.LIBDIR+"/utils.js");

const _memoryCheck = _ => ESB.conf.maxHeap && ESB.conf.maxHeap > process.memoryUsage().heapUsed;

class Message {
    constructor() {
        if (!_memoryCheck()) throw new Error(`Out of memory, heap used = ${process.memoryUsage().heapUsed}, max heap allowed = ${ESB.conf.maxHeap}`);
        this.timestamp = utils.getTimeStamp();
        this.routesDone = [];
        this.content = {};
        this.env = {};
        this.isGCEligible = true;
    }
    addRouteDone(routeName) {this.routesDone.push(routeName); this.isGCEligible = true;}
    addRouteError(routeName) {this.routesDone.push(`${routeName}.error`); this.isGCEligible = true;}
    setGCEligible(eligible) {this.isGCEligible = eligible}
    clone() {
        const clone = new Message();
        clone.timestamp = this.timestamp;
        clone.routesDone = this.routesDone.slice(0);
        clone.content = JSON.parse(JSON.stringify(this.content));
        clone.env = JSON.parse(JSON.stringify(this.env));

        return clone;
    }
};

exports.newMessage = _ => {return new Message();}
exports.newMessageAllocSafe = _ => {try {return new Message();} catch (err) {LOG.error(`[MESSAGE_FACTORY] ${err}`); return false;}}