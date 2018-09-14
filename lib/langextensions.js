/* 
 * langextensions.js, Javascript language extensions
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

Array.prototype.isSubset = function(array) {
    return this.every(element => array.includes(element));
}