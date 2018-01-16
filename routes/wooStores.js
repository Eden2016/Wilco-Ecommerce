"use strict";

var async = require('async');
var Kue = require('./KueService');
var api = require('./api');
var request = require('request');
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// Middleware base URL (no trailing /)
var baseURL = "https://middlewaretools.net";

// Woo base URL (no trailing /)
var wooURL = "https://production18.hosting";

if (process.env.NODE_ENV === "development") {
    baseURL = "http://localhost:3000";
}

exports.processSingle = function (req, res) {
    var storeData = req.body;
    //storeData.key = 'super cala fragilistic expialidocious'; // for some reason not being registered, when addded here
    request.post(wooURL + '/wp-content/themes/wilco-child/storesync.php', {form: storeData, json: true}, (err,wres,body) => {
        //console.log('error', err);
        //console.log('body', body);
        res.json(body);
    });
};