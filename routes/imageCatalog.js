"use strict";

var async = require('async');
var api = require('./api');
var request = require('request');

// Middleware base URL (no trailing /)
var baseURL = "https://middlewaretools.net";
var s3URL = 'https://imagecatalog.pics';

if (process.env.NODE_ENV === "development") {
    baseURL = "http://localhost:3000";
}

exports.syncImage = function(req, res) {
    var imageName = req.body.name;

    if (typeof imageName !== "undefined" && imageName !== null) {
        var image = imageName.split("_"); //[0] sku, [1] #.ext

        // static four images
        var imageArr = [{},{},{},{}];

        // get the images currently stored
        request(baseURL+"/api/v1/products/images/"+image[0], {json:true}, (err, resp, body) => {
            for (var i = 0; i < 4; i++) {
                if (typeof body[i] !== "undefined") {
                    imageArr[i] = body[i];
                }
            }

            var target = imageArr.filter(function (img) {
                if (typeof img.image == 'undefined') return false;
                return img.image.includes(imageName);
            });

            var number = ((image[1].replace(/.jpg/gi,"")).replace(/.jpeg/gi,"")).replace(/.png/gi,"");

            var updatedImg = {};
            updatedImg.image = s3URL+"/"+imageName;
            updatedImg.sku = image[0];
            updatedImg.valid = 1;
            updatedImg.primary = (number == 1) ? 1 : 0;
            updatedImg.timestamp = (new Date().toISOString()).slice(0, 19).replace('T', ' ');
            updatedImg.wooID = 0;

            if (target.length > 0) {
                // a record exists for this image, UPDATE
                updatedImg.id = target[0].id;
                var updateData = {
                    table: "images",
                    values: updatedImg
                }
                request.post(baseURL+'/api/update/', {form:updateData,json:true}, (err,res,body) => {});
            } else {
                // a record doesn't exist for this image, INSERT
                var data = {
                    "table": "images",
                    "values": updatedImg
                };
                request.post(baseURL+'/api/new/', {form:data,json:true}, (err,res,body) => {});
            }

            request(baseURL+'/api/products/'+image[0], {json:true}, (err,res,body) => {
                var product = body[0];
                var updateData = {
                    table: "products",
                    values: {
                        id: product.id,
                        item_number: product.item_number,
                        sync_to_woo: 1
                    }
                }
                request.post(baseURL+'/api/update/', {form:updateData,json:true}, (err,res,body) => {});
                request(baseURL+'/api/v1/process/single/'+product.item_number, {json:true}, (err,res,body) => {});
            });
            
        });
    }

    res.send("Done");
}