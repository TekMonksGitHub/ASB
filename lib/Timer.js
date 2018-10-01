/* 
 * Timer.js - Extendible timer
 * 
 * Thanks to https://stackoverflow.com/questions/36563749/how-i-extend-settimeout-on-nodejs
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

function Timer(t, fn) {
    this.fn = fn;
    this.time = Date.now() + t;
    this.updateTimer();
}
 
Timer.prototype.addTime = function(t) {
    this.time += t;
    this.updateTimer();
}
 
Timer.prototype.stop = function() {
    if (this.timer) {
        clearTimeout(this.timer);
        this.timer = null;
    }
}
 
Timer.prototype.updateTimer = function() {
    let self = this;
    this.stop();
    let delta = this.time - Date.now();
    if (delta > 0) { 
        this.timer = setTimeout(function() {
            self.timer = null;
            self.fn();
        }, delta);
    }
}

exports.Timer = Timer;