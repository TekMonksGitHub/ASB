/* 
 * (C) 2015 - 2018 TekMonks. All rights reserved.
 */
const os = require("os");
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
    const data = {esb: global.ESB, ...flow, ...message, constants: global.CONSTANTS, ESB_DIR: ASBCONSTANTS.ROOTDIR, process: global.process};
    return mustache.render(property, data);
}

function clone(object, skipProperties=[]) {
    if (!skipProperties.length) return JSON.parse(JSON.stringify(object));

    const clone = {}; for (const key in object) if (!skipProperties.includes(key)) clone[key] = JSON.parse(JSON.stringify(object[key]));
    return clone;
}

const getTempFile = ext =>
    `${os.tmpdir()+"/"+(Math.random().toString(36)+'00000000000000000').slice(2, 11)}.${getTimeStamp()}${ext?`.${ext}`:""}`;

/**
 * Creates an async function which executes the given code.
 * To call the function call the created function with the 
 * context. For example, 
 * const asyncFunction = util.createAsyncFunction(code);
 * await asyncFunction({key: value, key2: value2})
 * @param {string} code The code to execute
 * @returns Asynchronous function (or sync) which executes the
 *          given code when called.
 */
function createAsyncFunction(code) {
    const asyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const newFunction = context => new asyncFunction(Object.keys(context||{}).join(","), code)(...Object.values(context||{}));
    return newFunction;
}

/**
 * Creates a function which executes the given code synchronously.
 * To call the function call the created function with the 
 * context. For example, 
 * const myfunction = util.createSyncFunction(code);
 * await myfunction({key: value, key2: value2})
 * @param {string} code The code to execute
 * @returns Sync function which executes the given code when called.
 */
function createSyncFunction(code) {
    const retFunction = Object.getPrototypeOf(function(){}).constructor;
    const newFunction = context => new retFunction(Object.keys(context||{}).join(","), code)(...Object.values(context||{}));
    return newFunction;
}

module.exports = { getDateTime,  getTimeStamp, getObjectKeyValueCaseInsensitive, expandProperty, getTempFile, clone,
    createAsyncFunction, createSyncFunction };
