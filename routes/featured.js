"use strict";

var async = require('async');
var Kue = require('./KueService')
var api = require('./api');
var request = require('request');

// Middleware base URL (no trailing /)
var baseURL = "https://middlewaretools.net";

// Woo base URL (no trailing /)
var wooURL = "https://production18.hosting";

if (process.env.NODE_ENV === "development") {
    baseURL = "http://localhost:3000";
}

exports.processAll = function(req,res) {
    var products = [];

    async.series([
        function(cb) {
            request(baseURL+'/api/v1/products/master', {json:true}, (err,res,body) => {
                products = body;
                cb(null, products);
            });
        }
    ], function(err, results) {
        async.forEachSeries(products, function(product,cb) {
            var featured = "";
            // is product featured
            if (product['is_featured'] == 1) {
                // does it have a date range
                if (product['has_date_range'] == 1) {
                    var now = new Date().getTime();
                    var start = new Date(product.start_date.replace(' ', 'T'));
                    var end = new Date(product.end_date.replace(' ', 'T'));

                    console.log("Checking "+product.item_number+"  start/now/date: " +start.getTime()+", "+now+", "+end.getTime());

                    if (now >= start.getTime() && now <= end.getTime()) {
                        // it is featured
                        featured = true;
                        product.lite_sync_to_woo = 1;
                    } else if (now > end.getTime()) {
                        // it is ended
                        featured = false;
                        product.is_featured = 0;
                        product.has_date_range = 0
                        product.start_date = null;
                        product.end_date = null;
                        product.lite_sync_to_woo = 1;
                    }

                    var updateData = {
                        table: "products",
                        values: {
                            id: product.id,
                            item_number: product.item_number,
                            is_featured: product.is_featured,
                            has_date_range: product.has_date_range,
                            start_date: start.toISOString().slice(0, 19).replace('T', ' '),
                            end_date: end.toISOString().slice(0, 19).replace('T', ' '),
                            lite_sync_to_woo: product.lite_sync_to_woo
                        }
                    }
                    request.post(baseURL+'/api/update/', {form:updateData,json:true}, (err,res,body) => { cb(); });
                } else {
                    process.nextTick(function() { 
                        cb();
                    });
                }
            } else {
                process.nextTick(function() { 
                    cb();
                });
            }

            
        }, function() {
            res.send("Done");
        });
    });
}