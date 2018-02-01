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



var categories = [];
var species = [];
var descriptions = [];
var colors = [];
var sizes = [];
var brands = [];

var debug = true;

exports.runWooQueue = function(req, res) {
    var lite = req.params["lite"];
    if (lite === "lite") {
        Kue.runWooQueue(true);
    } else {
        Kue.runWooQueue();
    }
    res.send("Fired off Kue");
}

exports.clearWooQueue = function(req, res) {
    Kue.cleanKue();
    Kue.cleanComplete();
    res.send("Cleaned Kue");
}

exports.syncAll = function(req, res) {
    var products = [];

    var lite = false;
    if (req.params['lite'] === "lite") {
        lite = true;
    }

    // load in all the data we need to ref
    var jobs = [];
    if (lite) {
        jobs = [
            function(cb) {
                request(baseURL+'/api/v1/products/master', {json:true}, (err,res,body) => {
                    products = body;
                    cb(null, products);
                });
            }
        ];
    } else {
        jobs = [
            getCategories,
            getSpecies,
            getDescriptions,
            getColors,
            getSizes,
            getBrands,
            function(cb) {
                request(baseURL+'/api/v1/products/master', {json:true}, (err,res,body) => {
                    products = body;
                    cb(null, products);
                });
            }
        ];
    }
    async.series(jobs,
        function(err, results) {
            
            async.waterfall([
                function(cb) {
                    // processMasters(products, cb);
                    cb();
                }
            ],
                function(err, result) {
                    var count = 0;

                    async.forEachSeries(products, function(product,cb) {
                        try {
                            product.species_id = JSON.parse(product.species_id);
                        } catch(e) {
                        }
                        try {
                            product.added_category = JSON.parse(product.added_category);
                        } catch(e) {
                        }
        
                        var cleanFields = ['product_name', 'feature_1', 'feature_2', 'feature_3', 'feature_4'];
                        for (var x=0; x<cleanFields.length; x++) {
                            var cf = cleanFields[x];
                            if (product[cf] !== null) {
                                try { product[cf] = product[cf].replace(/\\'/g, "'"); } catch(e) {}
                                try { product[cf] = product[cf].replace(/\\"/g, '"'); } catch(e) {}
                            }
                        }
        
                        function callback(job, done) {
                            new WooProcess(job.data.product, job).processProduct(done);
                        }

                        var priority = "normal";
                        if (product.sync_to_woo == 2 || product.lite_sync_to_woo == 2) priority = "medium";
                        if (product.sync_to_woo == 3 || product.lite_sync_to_woo == 3) priority = "high";
                        
                        if (lite && product.lite_sync_to_woo !== 0) {
                            process.nextTick(function() { 
                                Kue.runWooLite(product, priority, callback, cb); 
                                count++;
                            });
                        } else if (!lite && product.sync_to_woo !== 0) {
                            process.nextTick(function() { 
                                Kue.runWoo(product, priority, callback, cb); 
                                count++;            
                            });           
                        } else {
                            process.nextTick(function() { 
                                cb();
                            });
                        }
                    }, function() {
                        if (lite) {
                            sl("*WooSyncLite:* Running on "+count+" products");
                        } else {
                            sl("*WooSyncFull:* Running on "+count+" products");
                        }
                        res.send("Done");
                    });
                }
            );
        }
    );

    
}

exports.processSingle = function(req, res) {
    var product = [];

    sl("*WooSyncSingle: Running on: " +req.params.sku);

    async.series([
        getCategories,
        getSpecies,
        getDescriptions,
        getColors,
        getSizes,
        getBrands,
        function(cb) {
            request(baseURL+'/api/products/'+req.params.sku, {json:true}, (err,res,body) => {
                product = body[0];
                cb(null, product);
            });
        }
    ],
        function(err, results) {
            function callback(job,done) {
                new WooProcess(job.data.product, job).processProduct(done);
            }

            async.waterfall([
                function(cb) {
                    Kue.runWooSingle(product, callback); 
                    cb();
                }
            ], 
                function() {
                    res.send("Done");
                }
            );
        }
    );
}

exports.processQueue = function(job, done, lite=false) {
    async.series([
        getCategories,
        getSpecies,
        getDescriptions,
        getColors,
        getSizes,
        getBrands
    ],
        function(err, results) {
            new WooProcess(job.data.product, job).processProduct(done, lite);
        }
    );
}

function WooProcess(product, job) {
    // vars for our target product
    this.targetProduct = product;
    this.targetProductWooData = {};

    this.job = job;

    this.lite = false;

    var self = this;
    this.debug = true;
    
    // The one function to rule them all
    this.processProduct = function(done, lite=false) {
        self.targetProduct = product;
        self.targetProductWooData = {};
        self.lite = lite;

        if (typeof product == 'undefined') {
            console.log("****** ERROR *******");
            console.log("A product in Kue is not passing product data, it will be stuck there.");
            console.log(job.data);
            job.remove();
            console.log("*********************");
            return false;
        }

        l("Now processing product: "+product.product_name +"(Item Number: "+product.item_number+") - LITE: "+lite);
    
        // init some arrays we need
        self.targetProductWooData.meta_data = [];

    
        // first, load in all the extra data we need to access
        var jobs = [];
        if (lite) {
            jobs.push(
                self.processPricing,
                self.processMaster
            );
        } else {
            jobs.push(
                self.processShortDescription,
                self.processImages,
                self.processPricing,
                self.processLocations,
                self.processMaster,
                self.processCategories,
                self.processBrands,
                self.processSpecies,
                self.processMetrics
            );
        }

        async.series(jobs,
            function(err, results) {
                if (lite) {
                    // we only need to update now
                    l("\t\tLITE: Update the product");
                    async.waterfall([
                        function(cb) {
                            self.wooLiteUpdate(cb);
                        }
                    ],
                        function(err,result) {
                            self.resetSyncToWoo(true);

                            l("\t\t\tFinished with the LITE product update.");
                            l("***************************************");
                            if (done!==null) {
                                done();
                            }
                        }
                    );
                } else {
                    var vo = self.targetProduct.master['Visible Online'];
            
                    l("\tVisible online? "+vo);
            
                    // check if the product should be visible online
                    if ((vo == 1 || vo == "1" || vo == "Yes" || vo == "yes") && self.targetProduct.product_name !== null) {
                        // prepare our other woo Data
                        self.targetProductWooData.name = (self.targetProduct.product_name == null) ? self.targetProduct.master['Item Description'] : self.targetProduct.product_name;
                        self.targetProductWooData.regular_price = (self.targetProductWooData.p90price !== '0') ? ""+self.targetProductWooData.p90price : ""+self.targetProduct.master['Retail Price'];
                        self.targetProductWooData.description = (descriptions[self.targetProduct.item_number] == null) ? "" : descriptions[self.targetProduct.item_number];
                        self.targetProductWooData.sku = self.targetProduct.item_number;
                        self.targetProductWooData.is_featured = self.targetProduct.is_featured;
                        self.targetProductWooData.has_date_range = self.targetProduct.has_date_range;
                        self.targetProductWooData.start_date = self.targetProduct.start_date;
                        self.targetProductWooData.end_date = self.targetProduct.end_date;
                        self.targetProductWooData.related_skus = JSON.parse(self.targetProduct.related_skus);
                        self.targetProductWooData.meta_data.push({
                            key: 'hide_pricing_online',
                            value: ""+self.targetProduct['hide_pricing_online']
                        });

                        // clear the description
                        if (typeof self.targetProductWooData.description != 'undefined' && self.targetProductWooData.description !== null) {
                            self.targetProductWooData.description = self.targetProductWooData.description.replace(/\\'/g, "'");
                            self.targetProductWooData.description = self.targetProductWooData.description.replace(/\\"/g, "'");
                        }

                        // make sure fineline is added to categories
                        if (self.targetProduct.master.finelineCat.length > 0) {
                            for (var i=0; i<self.targetProduct.master.finelineCat.length; i++) {
                                self.targetProductWooData.categories.push({id:self.targetProduct.master.finelineCat[i]});
                            }
                        }

                        // if there's no cats, assign it to Miscellaneous
                        if (self.targetProductWooData.categories.length == 0) {
                            self.targetProductWooData.categories.push({id:1211});
                        }
                        
                        // check if it's a simple or variable product
                        if (self.targetProduct.master_sku !== null) {
                            // it's a variation
                            l("\tProduct is a variation");
                            // we need a parent ID, so get it or create it
                            async.waterfall([
                                function(cb) {
                                    self.wooGetOrCreateParent(cb);
                                }
                            ],
                                function(err, result) {  
                                    var parent = result;

                                    var parentData = Object.assign({}, self.targetProductWooData);
                                    parentData.sku = self.targetProduct.master_sku;
                                    parentData.description = self.targetProductWooData.description;
                                    if (typeof parent.attributes !== 'undefined') {
                                        parentData.attributes = parent.attributes;
                                    }

                                    // set parent ID for later, it'll only get used on mode=variation
                                    self.targetProductWooData.parent = parent.id;
                                
                                    l("\t\tHave the parent with Woo ID: "+parent.id);
                                    
                                    // set our child product data to the correct attributes
                                    self.targetProductWooData.attributes = self.processVariables(self.targetProductWooData.attributes, 2);

                                    // and make sure out parent has all the correct attributes too
                                    parentData.attributes = self.processVariables(parentData.attributes, 1);

                                    // before we create our variation, update the parent to make sure all atrributes exist
                                    async.waterfall([
                                        function(cb) {
                                            //self.wooUpdateProduct(parent.id, parentData, cb);
                                            parentData.key = 'super cala fragilistic expialidocious';
                                            parentData.mode = 'parent';
                                            request.post(wooURL+'/wp-content/themes/wilco-child/woosync.php', {form:parentData, json:true}, (err,res,body) => { 
                                                cb();
                                            });
                                        }
                                    ],
                                        function(err, result) {
                                            // now we can create the child variation
                                            l("\t\Create or update the variation with data:");
                                            l(self.targetProductWooData);
                                            async.waterfall([
                                                function(cb) {
                                                    //self.wooCreateChildProduct(parent.id, self.targetProductWooData, cb);
                                                    self.targetProductWooData.key = 'super cala fragilistic expialidocious';
                                                    self.targetProductWooData.mode = 'variation';
                                                    request.post(wooURL+'/wp-content/themes/wilco-child/woosync.php', {form:self.targetProductWooData, json:true}, (err,res,body) => { 
                                                        cb();
                                                    });
                                                }
                                            ],
                                                function(err,result) {
                                                    self.resetSyncToWoo();

                                                    l("\t\t\tFinished with the variation.");
                                                    l("***************************************");
                                                    if (done!==null) {
                                                        done();
                                                    }
                                                }
                                            );
                                        }
                                    );
                                }
                            );
                        } else { // else product.master_sku !== null
                            // it's a simple product
                            l("\tProduct is a simple product, create or update it with data:");
                            l(self.targetProductWooData);

                            // full sync
                            async.waterfall([
                                function(cb) {
                                    self.wooCreateProduct(self.targetProductWooData, cb);
                                }
                            ],
                                function(err, result) {
                                    self.resetSyncToWoo();

                                    l("\t\tFinished with the simple product.");
                                    l("***************************************");
                                    if (done!==null) {
                                        done();
                                    }
                                }
                            );
                        } // endif product.master_sku !== null
                    } else {
                        // product shouldn't be visible online, make sure it isn't
                        l("\tProduct is not visible, make sure it's no online");
                        if (product.master_sku !== null) {
                            // delete the parent, the children go with it
                            request(baseURL+'/api/v1/products/sku/'+self.targetProduct.item_number, {json:true}, (err,req,body) => {
                                if (typeof body == 'undefined') { 
                                    console.log("Failed to delete the parent: "+self.targetProduct.item_number);
                                    done(); 
                                }
                                var productForDeletion = body[0];
                                if (typeof productForDeletion !== 'undefined') {
                                    if (productForDeletion.type == "variation") {
                                        // delete this variation, then check it's parent
                                        var parentIDToCheck = productForDeletion.parent_id;

                                        request.delete(baseURL+'/api/v1/productVariation/delete/', {form:productForDeletion, json:true}, (err,req,body) => {
                                            l("\t\tDeleted the variation.");

                                            // delete from swiftype
                                            request.post(baseURL+'/api/v1/swiftype/delete', {form:{url:productForDeletion.permalink}, json:true}, (err,req,body) => {});

                                            request(baseURL+'/api/v1/products/'+parentIDToCheck, {json:true}, (err,req,body) => {
                                                var parentToCheck = body;
                                                if (parentToCheck.variations.length == 0) {
                                                    // no more variations, so delete the parent
                                                    request.delete(baseURL+'/api/v1/products/delete/', {form:parentToCheck, json:true}, (err,req,body) => {
                                                        l("\t\tDeleted the parent.");

                                                        // delete from swiftype
                                                        request.post(baseURL+'/api/v1/swiftype/delete', {form:{url:parentToCheck.permalink}, json:true}, (err,req,body) => {});

                                                        // and the association
                                                        var data = {
                                                            table: 'products_variations',
                                                            id: parentToCheck.sku
                                                        }
                                                        request.post(baseURL+'/api/delete/', {form:data, json:true}, (err,req,body) => {
                                                            done();                                                
                                                        });
                                                    });
                                                } else {
                                                    l("\t\tParent still has variations, didn't delete/");
                                                    done(); 
                                                }
                                            });
                                        });
                                    } else {
                                        l("\t\tUnknown product.type, cannot delete.");
                                        done(); 
                                    }
                                } else {
                                    done();
                                }
                            });

                        } else {
                            // just delete the product
                            request(baseURL+'/api/v1/products/sku/'+self.targetProduct.item_number, {json:true}, (err,req,body) => {
                                if (body.length>0) {
                                    var productForDeletion = body[0];
                                    request.delete(baseURL+'/api/v1/products/delete/', {form:productForDeletion, json:true}, (err,req,body) => {
                                        l("\t\tDeleted the simple product.");
    
                                        if (typeof productForDeletion !== 'undefined') {
                                            // delete from swiftype
                                            request.post(baseURL+'/api/v1/swiftype/delete', {form:{url:productForDeletion.permalink}, json:true}, (err,req,body) => {});
                                        }
    
                                        done();
                                    });
                                }
                            });
                        }
            
                        l("***************************************");
                        if (done!==null) {
                            done();
                        }
                    }
                }
            }
        );
    };

    
    
    /*
        *
        *  PREPARATION FUNCTIONS
        * 
        */
    
    // process the short description from the feature_x fields
    this.processShortDescription = function(cb) {
        var shortDesc = "";
        shortDesc += (self.targetProduct.feature_1 !== null) ? "<ul>" : "";
        shortDesc += (self.targetProduct.feature_1 !== null) ? "<li>"+self.targetProduct.feature_1+"</li>" : "";
        shortDesc += (self.targetProduct.feature_2 !== null) ? "<li>"+self.targetProduct.feature_2+"</li>" : "";
        shortDesc += (self.targetProduct.feature_3 !== null) ? "<li>"+self.targetProduct.feature_3+"</li>" : "";
        shortDesc += (self.targetProduct.feature_4 !== null) ? "<li>"+self.targetProduct.feature_4+"</li>" : "";
        shortDesc += (shortDesc !== "") ? "</ul>" : "";

        self.targetProductWooData.short_description = shortDesc;

        cb(null,shortDesc);
    };
    
    // load in the images, then process it into our Woo Data
    this.processImages = function(cb) {
        var wooImages = [];
        if (typeof self.targetProduct.images == 'undefined') {
            self.targetProduct.images = [];
            var i = 0;
    
            // get our images from the DB
            request(baseURL+'/api/v1/products/images/'+self.targetProduct['item_number'], {json:true}, (err,res,body) => {
                // update our target product
                var theImages = body;
    
                // process it into woo data format
                var wooImages = [];
                async.forEachSeries(theImages, function(image, next) {
                    if (image.valid == 1) { // check it's valid
                        if (image.wooID !== null && image.wooID !== 0) {
                            wooImages.push({
                                id: image.wooID
                            });

                            i++;
                            next();
                        } else {
                            var options = {
                                url: wooURL+'/wp-content/themes/wilco-child/woo-upload-image.php',
                                method: 'POST',
                                form: {
                                    key: 'super cala fragilistic expialidocious',
                                    url: image.image
                                }
                            }
                            request(options, (err,res,body) => {
                                try {
                                    body = JSON.parse(body);
                                    
                                    image.wooID = body.id;

                                    wooImages.push({
                                        id: image.wooID
                                    });

                                    l("Uploaded image to woo");
                                    l(image.wooID);
                                    
                                    delete image.timestamp;
                                    var updateData = {
                                        table: 'images',
                                        values: image
                                    }
                                    request.post(baseURL+'/api/update', {form:updateData,json:true}, (err,res,body) => {
                                        i++;
                                        next();
                                    });
                                } catch (e) {
                                    l("Failed to upload image");
                                    l(e);
                                    i++;
                                    next();
                                }
                            });
                            
                              
                        
                                

                            
                        }
                    } else {
                        next();
                    }
                },
                    function() {
                        // assign to our woo data
                        self.targetProductWooData.images = wooImages;
                        cb(null, "processImages loaded");
                    }
                );
            });
        } else {
            cb(null, "processImages already set");
        }
    }
    
    // load in the pricing table, and process it into woo meta
    this.processPricing = function(cb) {
        if (typeof self.targetProduct.pricing == 'undefined') {
            self.targetProduct.pricing = [];
    
            // load in the products_locations table
            request(baseURL+'/api/pricing/'+self.targetProduct['item_number'], {json:true}, (err,res,body) => {
                // update our target product
                self.targetProduct.pricing = body[0];
                
                if (typeof self.targetProduct.pricing !== 'undefined') {
                    var locNumbers = [1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,19,20,21,90,99];
                    var wooMeta = [];

                    // prepare all of the woo meta qa_xxx, rp_xxx, and pp_xxx
                    for (var i=0; i<locNumbers.length; i++) {
                        var locNum = locNumbers[i];
                        wooMeta.push({
                            key: "q"+locNum, //"qa_"+("000"+locNum).slice(-3),
                            value: ""+self.targetProduct.pricing[locNum + " Quantity Available"]
                        });
                        wooMeta.push({
                            key: "p"+locNum, //"rp_"+("000"+locNum).slice(-3),
                            value: ""+self.targetProduct.pricing[locNum + " Retail Price"]
                        });
                        wooMeta.push({
                            key: "sp"+locNum, //"pp_"+("000"+locNum).slice(-3),
                            value: ""+self.targetProduct.pricing[locNum + " Promotion Price"]
                        });

                        if (locNum == 90) {
                            self.targetProductWooData.p90price = ""+self.targetProduct.pricing[locNum + " Retail Price"];
                            self.targetProductWooData.sale_price = ""+self.targetProduct.pricing[locNum + " Promotion Price"];
                        }
                    };

                    // assign it to our woo data
                    self.targetProductWooData.meta_data = self.targetProductWooData.meta_data.concat(wooMeta);

                }
                
                cb(null, "processPricing loaded");
            });
        } else {
            cb(null, "processPricing already loaded");
        }
    }
    
    // load in the locations table, and process it into woo meta
    this.processLocations = function(cb) {
        if (typeof self.targetProduct.locations == 'undefined') {
            self.targetProduct.locations = [];
    
            // load in the products_location_secondary table
            request(baseURL+'/api/productLocations/'+self.targetProduct['item_number'], {json:true}, (err,res,body) => {
                // assign it to our target product
                self.targetProduct.locations = body[0];

                if (typeof self.targetProduct.locations !== 'undefined') {
    
                    if (typeof self.targetProduct.locations !== "undefined" ){
                        var locNumbers = [1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,19,20,21,90,99];
                        var wooMeta = [];
        
                        // prepare all of the woo meta bin_xxx, loading_required_xxx, and order_point_xxx
                        for (var i=0; i<locNumbers.length; i++) {
                            var locNum = locNumbers[i];
                            wooMeta.push({
                                key: "bin_"+("000"+locNum).slice(-3),
                                value: ""+self.targetProduct.locations[locNum + " Location"]
                            });
                            wooMeta.push({
                                key: "loading_required_"+("000"+locNum).slice(-3),
                                value: ""+self.targetProduct.locations[locNum + " Loading Required?"]
                            });
                            wooMeta.push({
                                key: "order_point_"+("000"+locNum).slice(-3),
                                value: ""+self.targetProduct.locations[locNum + " Order Point"]
                            });
                        };
        
                        // assign it to our woo data
                        self.targetProductWooData.meta_data = self.targetProductWooData.meta_data.concat(wooMeta);
                    }
                }
                
                cb(null, "processLocations loaded");
            });
        } else {
            cb(null, "processLocations already loaded");
        }
    }
    
    // load in the master table, and process it into woo meta
    this.processMaster = function(cb) {
        if (typeof self.targetProduct.master == 'undefined') {
            self.targetProduct.master = []; // init the array
    
            // load in the products_master table
            request(baseURL+'/api/productMaster/'+self.targetProduct['item_number'], {json:true}, (err,res,body) => {
                // assign it to our target product
                self.targetProduct.master = body[0];

                if (typeof self.targetProduct.master !== 'undefined') {
    
                    // prepare our woo meta
                    var wooMeta = [];
                    wooMeta.push({
                        key: 'item_description',
                        value: self.targetProduct.master['Item Description']
                    });
                    wooMeta.push({
                        key: 'stocking_um',
                        value: self.targetProduct.master['Stocking U/M']
                    });
                    wooMeta.push({
                        key: 'discontinued',
                        value: ((self.targetProduct.master['Discontinued Item?']=='Y') ? "1" : "0")
                    });
                    wooMeta.push({
                        key: 'visible_online',
                        value: ((self.targetProduct.master['Visible Online']=='Yes') ? "1" : "0")
                    });
                    wooMeta.push({
                        key: 'quantity_break_code',
                        value: self.targetProduct.master['Quantity Break Code']
                    });
                    wooMeta.push({
                        key: 'mfg_part',
                        value: self.targetProduct.master['MFG Part #']
                    });
                    wooMeta.push({
                        key: 'iMap',
                        value: ""+self.targetProduct.master['iMAP']
                    });
                    wooMeta.push({
                        key: 'purchase_um',
                        value: self.targetProduct.master['Purchase U/M']
                    });
                    wooMeta.push({
                        key: 'keep_stock_data',
                        value: ((self.targetProduct.master['Keep Stock Data?']=='Y') ? "1" : "0")
                    });
                    wooMeta.push({
                        key: 'date_added',
                        value: self.targetProduct.master['Date Added'].substring(0, self.targetProduct.master['Date Added'].indexOf("T")).replace("-","")
                    });
                    wooMeta.push({
                        key: 'tax_exempt_category',
                        value: self.targetProduct.master['Tax Exampt Category']
                    });
                    wooMeta.push({
                        key: 'order_multiple',
                        value: self.targetProduct.master['Order Multiple']
                    });
        
                    // assign it to our woo data
                    self.targetProductWooData.meta_data = self.targetProductWooData.meta_data.concat(wooMeta);

                    // assign the date
                    self.targetProductWooData.date = self.targetProduct.master['Date Added'].replace(".000Z", "");
        
                    // figure out the fineline category
                    if (self.targetProduct.master['Current Fineline Code'] !== null && self.targetProduct.master['Current Fineline Code'] !== 0) {
                        request(baseURL+'/api/fineline/'+self.targetProduct.master['Current Fineline Code'], {json:true}, (err,res,body) => {
                            self.targetProduct.master.finelineCat = [];

                            if (typeof body[0] !== "undefined") {
                                var cat = body[0].pcat_id;
                                self.targetProduct.master.finelineCat.push(categories[cat].woo_id);
                            
                                for (var x=0; x<2; x++) {
                                    if (categories[cat].parent_id !== null) {
                                        cat = categories[cat].parent_id;
                                        if (typeof categories[cat] !== 'undefined') {
                                            self.targetProduct.master.finelineCat.push(categories[cat].woo_id);
                                        }
                                    }
                                }
                            }
                            cb(null, "processMaster loaded");
                        });
                    } else {
                        self.targetProduct.master.finelineCat = null;

                        cb(null, "processMaster loaded");
                    }
                } else {
                    // we are missing master data, so set VO = no to make sure it's deleted
                    self.targetProduct.master = [];
                    self.targetProduct.master['Visible Online'] = "no";
                    sl("*WooSync:* Product SKU "+self.targetProduct.item_number+" is missing a product_master record.\nI'll make sure the product isn't published to Woo");
                    
                    cb(null, "processMaster failed");
                }
            });
        } else {
            cb(null, "processMaster already loaded");
        }
    }
    
    // matches categories to the woo cat IDs
    this.processCategories = function(cb) {
        var wooCats = [];
        if (self.targetProduct.added_category !== null) {
            for (var i=0; i<self.targetProduct.added_category.length; i++) {
                var cat = self.targetProduct.added_category[i];
                if (typeof categories[cat] !== 'undefined') {
                    wooCats.push({id:categories[cat].woo_id});
                }
                for (var x=0; x<2; x++) {
                    if (typeof categories[cat] !== 'undefined') {
                        cat = categories[cat].parent_id;
                        if (typeof categories[cat] !== 'undefined') {
                            wooCats.push({id:categories[cat].woo_id});
                        }
                    }
                }
            }
        }
    
        self.targetProductWooData.categories = wooCats;
    
        cb(null, "processCategories loaded");
    }
    
    // matches species to the woo term IDs
    this.processSpecies = function(cb) {
        var wooSpecies = [];
        if (self.targetProduct.species_id !== null) {
            for (var i=0; i<self.targetProduct.species_id.length; i++) {
                var spc = self.targetProduct.species_id[i];
                if (typeof species[spc] !== 'undefined') {
                    wooSpecies.push(sentenceCase(species[spc].woo_id));
                }
            }
    
            self.targetProductWooData.species = wooSpecies;
        }
    
        cb(null, "processSpecies loaded");
    }


    // matches brands to the woo term IDs
    this.processBrands = function(cb) {
        if (self.targetProduct.brand_id !== null) {
            if (typeof brands[self.targetProduct.brand_id].woo_id !== 'undefined') {
                self.targetProductWooData.brands = [brands[self.targetProduct.brand_id].woo_id]
            }
        }
    
        cb(null, "processBrands loaded");
    }
    
    // process the dimensions and weight
    this.processMetrics = function (cb) {
        if (typeof self.targetProduct.master == 'undefined') {
            var wooDimensions = {
                length: "99999",
                width: "99999",
                height: "99999"
            };
            self.targetProductWooData.dimensions = wooDimensions;

            var wooWeight = 99999;
            self.targetProductWooData.weight = ""+wooWeight;

            var wooMeta = [];
            wooMeta.push({
                key: '_wc_local_pickup_plus_local_pickup_product_availability',
                value: "required"
            });

            self.targetProductWooData.meta_data = self.targetProductWooData.meta_data.concat(wooMeta);

        } else {
            var wooDimensions = {
                length: ""+self.targetProduct.master['Item Depth'],
                width: ""+self.targetProduct.master['Item Width'],
                height: ""+self.targetProduct.master['Item Height']
            };
    
            // if any dimension is missing
            if ( (wooDimensions['length'] * wooDimensions['width'] + wooDimensions['height']) == 0) {
                wooDimensions['length'] = "99999";
                wooDimensions['width'] = "99999";
                wooDimensions['height'] = "99999";
            }
        
            self.targetProductWooData.dimensions = wooDimensions;
                
            // weight
            var wooWeight = null;
            if (self.targetProduct.master['Weight Unit'] == "TN") {
                wooWeight = self.targetProduct.master['Weight'] * 2000;
            } else if (self.targetProduct.master['Weight Unit'] == "OZ") {
                wooWeight = self.targetProduct.master['Weight']/16;
            } else if (self.targetProduct.master['Weight Unit'] == "GR") {
                wooWeight = self.targetProduct.master['Weight']*0.0022;
            } else {
                wooWeight = self.targetProduct.master['Weight'];
            }
    
            // if 0 or null, set to 99999
            if (wooWeight == 0 || wooWeight == null) {
                wooWeight = 99999;
            }
        
            self.targetProductWooData.weight = ""+wooWeight;
        
            // bonus meta key _wc_local_pickup_plus_local_pickup_product_availability
            var wooMeta = [];
            if (
                (   
                    wooWeight == 0 || 
                    wooWeight >= 150 || 
                    ((self.targetProduct.master['Item Depth']*self.targetProduct.master['Item Width']*self.targetProduct.master['Item Height'])==0)
                ) || (self.targetProduct.master['Weight Unit'] == "PC")
            ) {
                wooMeta.push({
                    key: '_wc_local_pickup_plus_local_pickup_product_availability',
                    value: "required"
                });
            } else {
                wooMeta.push({
                    key: '_wc_local_pickup_plus_local_pickup_product_availability',
                    value: "allowed"
                });
            }
    
            // assign it to our woo data
            self.targetProductWooData.meta_data = self.targetProductWooData.meta_data.concat(wooMeta);
        }
    
        cb(null, "processMetrics loaded");
    
    }
    
    // Proceesses size/color into various Woo meta format
    // Mode=1 for parent meta   
    //      attributes = [{name:'', options:[], visible:true, variation:true}]
    // Mode=2 for child meta
    //      attributes = [{name:'', option:''}]
    //
    this.processVariables = function(attributes=[], mode=1) {
    
        // can we just skip this?
        if (self.targetProduct.color_id !== null || self.targetProduct.size_id !== null) {
            if (attributes.length == 0 && mode==1) {
                // no options, so just init what we need
                attributes = [{name: 'Color', options: []}, {name: 'Size', options: []}];
            } else if (attributes.length == 0 && mode==2) {
                // no options, so just init what we need
                attributes = [{name: 'Color', options: []}, {name: 'Size', options: []}];
            }
    
            // go through each existing attribute array
            for (var i=0; i<attributes.length; i++) {
                var attribute = attributes[i];
    
                // process color if we have to
                if (attribute.name == "Color" && self.targetProduct.color_id !== null) {
                    // we check if it's already in the attributes, so we don't have dupes
                    var theColor = ""+colors[self.targetProduct.color_id];
                    theColor = sentenceCase(theColor);
                    if (theColor === false) theColor = "";
                    if (attribute.options.indexOf(theColor) == -1 && mode==1) {
                        attribute.options.push(theColor);
                    } else {
                        attribute.option = theColor;
                    }
    
                    // if this is for a parent, we need a couple extra things
                    if (mode==1) {
                        attribute.visible = true;
                        attribute.variation = true;
                    }

                    // clean up old false entries
                    var idx = attribute.options.indexOf('false');
                    if (idx>=0) {
                        attribute.options.splice(idx,1);
                    }
                }
    
                // process size if we have to
                if (attribute.name == "Size" && self.targetProduct.size_id !== null) {
                    // we check if it's already in the attributes, so we don't have dupes
                    var theSize = ""+sizes[self.targetProduct.size_id];
                    if (typeof theSize !== "undefined") theSize = theSize.toUpperCase();
                    if (attribute.options.indexOf(theSize) == -1 && mode==1) {
                        attribute.options.push(theSize);
                    } else {
                        attribute.option = theSize;
                    }
    
                    // if this is for a parent, we need a couple extra things
                    if (mode==1) {
                        attribute.visible = true;
                        attribute.variation = true;
                    }

                    // clean up old false entries
                    var idx = attribute.options.indexOf('false');
                    if (idx>=0) {
                        attribute.options.splice(idx,1);
                    }
                }
    
            };
    
            // return our processed array
            return attributes;
        }
        
        // skipped, so just return what was sent
        return attributes;
    }

    // this resets the sync to woo colummsn
    this.resetSyncToWoo = function(lite=false) {

        if (self.targetProduct.lite_sync_to_woo == null) {self.targetProduct.lite_sync_to_woo=0}
        if (self.targetProduct.sync_to_woo == null) {self.targetProduct.sync_to_woo=0}

        if (lite) {
            self.targetProduct.lite_sync_to_woo = 0;
        } else {
            self.targetProduct.sync_to_woo = 0;
        }

        var updateData = {
            table: "products",
            values: {
                id: self.targetProduct.id,
                item_number: self.targetProduct.item_number,
                sync_to_woo: self.targetProduct.sync_to_woo,
                lite_sync_to_woo: self.targetProduct.lite_sync_to_woo
            }
        }
        request.post(baseURL+'/api/update/', {form:updateData,json:true}, (err,res,body) => {});
    }
    
    
    
    
    
    /*
        *
        * WOO API FUNCTIONS
        * 
        */
    
    // this is going to look for an existing parent, and retrieve it or create it
    this.wooGetOrCreateParent = function(cb) {
        request(baseURL+'/api/productVariations/'+self.targetProduct.master_sku, {json:true}, (err,res,body) => {
            if (body.length == 0) {
                // no parent exists, create one
                var parentData = {};
                parentData = Object.assign({}, self.targetProductWooData);
                parentData.sku = self.targetProduct.master_sku;
                parentData.type = "variable";
    
                parentData.attributes = self.processVariables(parentData.attributes, 1);
    
                l("\t\tCreating a parent product with data:");
                l(parentData);
    
                async.waterfall([
                    function(cb) {
                        request.post(baseURL+'/api/v1/products/new', {form:parentData,json:true}, (err,res,body) => {
                            var response = JSON.parse(body);
                            var parent = response;
        
                            if (response.code === "product_invalid_sku") {
                                // product probably exists already
                                request(baseURL+'/api/v1/products/'+response.data.resource_id, {json:true}, (err,req,body) => {
                                    var parent = body;
                                    cb(null, parent);
                                });
                            } else {
                                cb(null, parent);
                            }
                        });
                    }
                ],
                    function(err, result) {
                        var parent = result; 

                        async.waterfall([
                            function(cb) {
                                self.wooAssignSpeciesAndDate(parent.id, parentData.species, cb);
                            }
                        ],
                            function(err, result) {
                                var prepData = {
                                    "table": "products_variations",
                                    "values": {
                                        master_sku: self.targetProduct.master_sku,
                                        woo_parent: parent.id
                                    }
                                };
            
                                request.post(baseURL+"/api/new", {form:prepData}, (err,res,body) => {
                                    cb(null, parent);
                                });
                            }
                        );
                    }
                );
            } else {
                l("\t\tFound an existing parent product.");
                request(baseURL+'/api/v1/products/'+body[0].woo_parent, {json:true}, (err,req,body) => {
                    var parent = body;
                    cb(null, parent);
                });
            }
        });
    }
    
    this.wooUpdateProduct = function(targetID, data, cb) {
        request.put(baseURL+'/api/v1/products/update/'+targetID, {form:data, json:true}, (err,res,body) => {
            var response = JSON.parse(body);
    
            if (typeof response.id !== 'undefined') {
                self.wooAssignSpeciesAndDate(response.id, self.targetProductWooData.species);
            }
    
            // check the response
            if (typeof response.id !== 'undefined') {
                // product was created
                l("\t\tUpdated the product as it already existed, Woo ID: "+response.id);
                cb(null,null);
            } else if (response.code === "product_invalid_sku") {
                // product probably exists already
                l("\t\t!!! Couldn't find the product to be updated.");
                cb(null,null);
            } else {
                // Something unexpected happened
                l("!!! Something wen't wrong within wooUpdateProduct(), here's the response:");
                l(response);
                cb(null,null);
            }
        });
    }
    
    this.wooUpdateChildProduct = function(parentID, childID, data, cb) {
    
        request.put(baseURL+'/api/v1/products/update/'+parentID+'/'+childID, {form:data, json:true}, (err,res,body) => {
            var response = JSON.parse(body);
    
            if (typeof response.id !== 'undefined') {
                self.wooAssignSpeciesAndDate(parentID, self.targetProductWooData.species);
            }
            
            // check the response
            if (typeof response.id !== 'undefined') {
                // product was created
                l("\t\t\tUpdated the variation as it already existed, Woo ID: "+response.id);
            } else if (response.code === "product_invalid_sku") {
                // product probably exists already
                l("\t\t\t!!! Couldn't find the product to be updated.")
            } else {
                // Something unexpected happened
                message.text = "Something went wrong.";
                l("!!! Something wen't wrong within wooUpdateChildProduct(), here's the response:");
                l(response);
            }
    
            cb(null, null);
        });
    }
    
    this.wooCreateChildProduct = function(parentID, data, cb) {
        request.post(baseURL+'/api/v1/products/new/'+parentID, {form:data,json:true}, (err,res,body) => {
            var response = JSON.parse(body);
    
            if (typeof response.id !== 'undefined') {
                self.wooAssignSpeciesAndDate(parentID, self.targetProductWooData.species);
            }
    
            // check the response
            if (typeof response.id !== 'undefined') {
                // product was created
                // *** todo: set the flag
                l("\t\t\tCreated with Woo ID: "+response.id);
                cb(null, null);
            } else if (response.code === "product_invalid_sku") {
                // product probably exists already
                async.waterfall([
                    function(cb) {
                        self.wooUpdateChildProduct(parentID, response.data.resource_id, data, cb);
                    }
                ],
                    function(err, result) {
                        cb(null, null);
                    }
                );
            } else {
                // Something unexpected happened
                l("!!! Something wen't wrong within wooCreateChildProduct(), here's the response:");
                l(response);
                cb(null, null);
            }
    
        });  // end DS.wooCreateProduct
    }
    
    
    this.wooCreateProduct = function(data, cb, lite=false) {  
        self.targetProductWooData.key = 'super cala fragilistic expialidocious';
        self.targetProductWooData.mode = 'simple';
        request.post(wooURL+'/wp-content/themes/wilco-child/woosync.php', {form:self.targetProductWooData, json:true}, (err,res,body) => { 
            console.log(body);
            cb();
        });
        /*request.post(baseURL+'/api/v1/products/new', {form:data, json:true}, (err,res,body) => {  
            var response = JSON.parse(body);
    
            if (typeof response.id !== 'undefined') {
                self.wooAssignSpeciesAndDate(response.id, self.targetProductWooData.species);
            }

            
            if (typeof response.id !== 'undefined') {
                // product was created
                // *** todo: set the flag
                l("\t\tCreated with Woo ID: "+response.id);
                cb(null, null);
            } else if (response.code === "product_invalid_sku") {
                // product probably exists already
                // *** todo: add in update function
                async.waterfall([
                    function(cb) {
                        self.wooUpdateProduct(response.data.resource_id, data, cb);
                    }
                ],
                    function(err, result) {
                        cb(null, null);
                    }
                );
                
            } else {
                // Something unexpected happened
                l("!!! Something wen't wrong within wooCreateProduct(), here's the response:");
                l(response);
                cb(null, null);
            }
        });  // end DS.wooCreateProduct*/
    }
    
    this.wooAssignSpeciesAndDate = function(target, species, cb=null) {
        // skup if LITE
        if (self.lite) {
            if (cb!==null) {
                cb(null, null);
            }
        }

        var prepData = {
            species: species,
            date: self.targetProductWooData.date
        };

        var options = {
            url: wooURL+'/wp-json/wp/v2/product/'+target,
            headers: {
                'Authorization': 'Basic V2lsY28gRmFybSBTdG9yZXM6b3hLYSA3VDI4IHRHdXMgUVNmMCBiUTBMIHVLb2k=',
            },
            method: 'POST',
            form: prepData
        }

        request(options, (err, res, body) => {
            if (cb!==null) {
                cb(null, body);
            }
        });

    }

    this.wooLiteUpdate = function(cb) {
        l("** Running LITE update **");
        var data = {
            key: 'super cala fragilistic expialidocious',
            sku: self.targetProduct.item_number,
            meta: self.targetProductWooData,
            is_featured: self.targetProduct.is_featured,
            has_date_range: self.targetProduct.has_date_range,
            start_date: self.targetProduct.start_date,
            end_date: self.targetProduct.end_date,
            regular_price: (self.targetProductWooData.p90price !== '0') ? ""+self.targetProductWooData.p90price : ""+self.targetProduct.master['Retail Price']
        }

        l("Sending data:");
        l(data);
        var options = {
            url: wooURL+'/wp-content/themes/wilco-child/woosync-lite.php',
            headers: {
                'Authorization': 'Basic V2lsY28gRmFybSBTdG9yZXM6b3hLYSA3VDI4IHRHdXMgUVNmMCBiUTBMIHVLb2k=',
            },
            method: 'POST',
            form: data
        }

        request(options, (err, res, body) => {
            l(body);
            if (cb!==null) {
                cb(null, body);
            }
        });
    }

    function l(message) {
        if (debug) {
            job.log(message);
        }
    }

    function sl(message) {
        var data = {
            text:message,
            mrkdwn: true
        }
    
        var options = {
            url: 'https://hooks.slack.com/services/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',
            method: 'POST',
            body: JSON.stringify(data)
        }
    
        console.log(data);
        console.log(options);
    
        request(options, (err,res,body) => {});
    }

    function sentenceCase (str) {
        if ((str===null) || (str==='') || (typeof str == 'undefined'))
            return false;
        else
            str = str.toString();
      
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    }
    
}


function sl(message) {
    var data = {
        text:message,
        mrkdwn: true
    }

    var options = {
        url: 'https://hooks.slack.com/services/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',
        method: 'POST',
        body: JSON.stringify(data)
    }

    console.log(data);
    console.log(options);

    request(options, (err,res,body) => {});
}

function getDescriptions(cb) {
    //if (descriptions.length==0) {
        request(baseURL+'/api/productDescriptions/', {json:true}, (err,res,body) => {
            body.map(function(cv,i,a) {
                descriptions[cv.item_number] = cv.full_desc;
            });
            cb(null, descriptions);
        });
    // } else {
    //     cb(null,descriptions);
    // }
}

function getBrands(cb) {
    if (brands.length==0) {
        request(baseURL+'/api/productBrands/', {json:true}, (err,res,body) => {
            body.map(function(cv,i,a) {
                brands[cv.id] = cv;
            });
            cb(null, brands);
        });
    } else {
        cb(null,brands);
    }
}

function getCategories(cb) {
    if (categories.length==0) {
        request(baseURL+'/api/productCategories/', {json:true}, (err,res,body) => {
            body.map(function(cv,i,a) {
                categories[cv.id] = cv;
            });
            cb(null, categories);
        });
    } else {
        cb(null,categories);
    }
}

function getSpecies(cb) {
    if (species.length==0) {
        request(baseURL+'/api/productSpecies/', {json:true}, (err,res,body) => {
            body.map(function(cv,i,a) {
                species[cv.id] = cv;
            });
            cb(null, species);
        });
    } else {
        cb(null,species);
    }
}

function getSizes(cb) {
    if (sizes.length==0) {
        request(baseURL+'/api/productSizes/', {json:true}, (err,res,body) => {
            body.map(function(cv,i,a) {
                sizes[cv.id] = cv.size_name;
            });
            cb(null, sizes);
        });
    } else {
        cb(null,sizes);
    }
}

function getColors(cb) {    
    if (colors.length==0) {
        request(baseURL+'/api/productColors/', {json:true}, (err,res,body) => {
            body.map(function(cv,i,a) {
                colors[cv.id] = cv.name;
            });
            cb(null, colors);
        });
    } else {
        cb(null,colors);
    }
}

function processMasters(products, cb) {
    // first narrow down to just products with master_sku
    var productsWithMaster = products.filter(function(p) {
        return p.master_sku !== null;
    });

    // we'll use this as a cross check to see if we already have it
    var masterSKUs = [];
    // and this to store the actual Products we're going to work with
    var masters = [];

    // this will filter down further so we have ONE Product only in masters
    for (var i=0; i<productsWithMaster.length; i++) {
        var pwm = productsWithMaster[i];
        
        if (masterSKUs.indexOf(pwm.master_sku) == -1) {
            masterSKUs.push(pwm.master_sku);
            masters.push(pwm);
        }
    }

    async.forEachSeries(masters, function(master, cb2) {

        try {
            master.species_id = JSON.parse(master.species_id);
        } catch(e) {
        }
        try {
            master.added_category = JSON.parse(master.added_category);
        } catch(e) {
        }

        var cleanFields = ['product_name', 'feature_1', 'feature_2', 'feature_3', 'feature_4'];
        for (var x=0; x<cleanFields.length; x++) {
            var cf = cleanFields[x];
            if (master[cf] !== null) {
                try { master[cf] = master[cf].replace(/\\'/g, "'"); } catch(e) {}
                try { master[cf] = master[cf].replace(/\\"/g, '"'); } catch(e) {}
            }
        }
        
        function callback(job,done) {
            
        }

        request(baseURL+'/api/productVariations/'+master.master_sku, {json:true}, (err,res,body) => {
            if (typeof body !== 'undefined') {
                if (body.length == 0) {
                    // we don't have a parent stored in the products_variations table, so go ahead and queue a job which will result in it being created
                    Kue.runWooMaster(master, callback);
                }
                cb2();
            }
        });
    });

    Kue.runWooMasterQueue();

    cb();
}