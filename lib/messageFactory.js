/* 
 * messageFactory.js, ESB Message factory
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

const utils = require(ASBCONSTANTS.LIBDIR+"/utils.js");

const _memoryCheck = _ => ESB.conf.maxHeap && ESB.conf.maxHeap > process.memoryUsage().heapUsed;

class Message {
    constructor() {
        if (!_memoryCheck()) throw new Error(`Out of memory, heap used = ${process.memoryUsage().heapUsed}, max heap allowed = ${ESB.conf.maxHeap}`);
        this.timestamp = utils.getTimeStamp();
        this.routesDone = [];
        this.content = {};
        this.env = {};
        this.isGCEligibleFlag = true;
    }
    modifyRouteStamp(newstamp) {
        this.routesDone = Array.from(newstamp); 
        this.routeStampManuallyModified = true;   
    }
    popRouteStampManuallyModified() { 
        const oldValue = this.routeStampManuallyModified; delete this.routeStampManuallyModified;
        if (oldValue == false || oldValue === undefined) return false; else return true; 
    }
    addRouteDone(routeName) {
        this.routesDone.push(routeName); 
        this.isGCEligibleFlag = true;
    }
    addRouteError(routeName) {
        this.routesDone.push(`${routeName}.error`); 
        this.isGCEligibleFlag = true;
    }
    setGCEligible(flag) {this.isGCEligibleFlag = flag;}
    isGCEligible() {
        if (this.gcEligibleCounter &&  this.gcEligibleCounter > 0) return false;
        else return this.isGCEligibleFlag;
    }
    setGCEligibleCounter(counter) {this.gcEligibleCounter = counter;}
    decrementGCEligibleCounter() {
        if (this.gcEligibleCounter && this.gcEligibleCounter > 0) this.gcEligibleCounter--; 
    }
    getGCEligibleCounter() {return this.gcEligibleCounter;}
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
exports.newMessageAllocSafe = _ => {try {return new Message();} catch (err) {ASBLOG.error(`[MESSAGE_FACTORY] ${err}`); return false;}}