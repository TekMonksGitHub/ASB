/* 
 * (C) 2015 - 2018 TekMonks. All rights reserved.
 */
const mustache = require("mustache"); 

function getDateTime() {

    const date = new Date();

    let hour = date.getHours();
    hour = (hour < 10 ? "0" : "") + hour;

    let min = date.getMinutes();
    min = (min < 10 ? "0" : "") + min;

    let sec = date.getSeconds();
    sec = (sec < 10 ? "0" : "") + sec;

    const year = date.getFullYear();

    let month = date.getMonth() + 1;
    month = (month < 10 ? "0" : "") + month;

    let day = date.getDate();
    day = (day < 10 ? "0" : "") + day;

    return `${year}:${month}:${day}:${hour}:${min}:${sec}`;
}

function getTimeStamp() {
    let hrTime = process.hrtime();
    return hrTime[0] * 1000000000 + hrTime[1];
}

function getObjectKeyValueCaseInsensitive(obj, key) {
    for (const keyThis of Object.keys(obj)) if (keyThis.toUpperCase() == key.toUpperCase()) return obj[keyThis];
    return null;
}

function expandProperty(property, flow, message) {
    const data = {esb: global.ESB, flow, message, constants: global.CONSTANTS, ESB_DIR: CONSTANTS.ROOTDIR, process: global.process};
    return mustache.render(property, data);
}

module.exports = { getDateTime,  getTimeStamp, getObjectKeyValueCaseInsensitive, expandProperty };
