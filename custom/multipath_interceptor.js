/* 
 * Example multipath interceptor
 * (C) 2018 TekMonks. All rights reserved.
 */

exports.start = (_routeName, filewriter, _messageContainer, message) => {
    filewriter.path = message.env.filepath + ".json";
}