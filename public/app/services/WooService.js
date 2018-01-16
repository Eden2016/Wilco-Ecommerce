'use strict';

app.service('WooService', ['$http', 'MessagingService', 'DataService.api', 'authService', '$q', function ($http, MS, DS, authService, $q, angularAuth0) {
    
    // vars for our target product
    var targetProduct = [];
    var targetProductWooData = {};

    // globals for data we need during processing
    // todo: assign these at an init() rather than in processProduct()
    var categories = [];
    var species = [];
    var descriptions = [];
    var colors = [];
    var sizes = [];
    var brands = [];

    var self = this;
    var debug = true;

    this.syncAll = function() {
        // load in all the data we need to ref
        var promises = [];
        promises.push(
            getCategories(),
            getSpecies(),
            getDescriptions(),
            getColors(),
            getSizes(),
            getBrands()
        );

        $q.all(promises).then(function(r) {
            // now we're ready to go!
            DS.getProducts().then(function(response) {
                // clean some data
                response.data.forEach(function(cv,i,a) {
                    try {
                        cv.species_id = JSON.parse(cv.species_id);
                    } catch(e) {
                        console.log("Species isn't valid data");
                    }
                    try {
                        cv.added_category = JSON.parse(cv.added_category);
                    } catch(e) {
                        console.log("Added category isn't valid data");
                    }
    
                    // clean punctuation
                    var cleanFields = ['product_name', 'feature_1', 'feature_2', 'feature_3', 'feature_4'];
                    cleanFields.forEach(function(cf,i,a) {
                        if (cv[cf] !== null) {
                            cv[cf] = cv[cf].replace(/\\'/g, "'");
                            cv[cf] = cv[cf].replace(/\\"/g, '"');
                        }
                    });
                });
    
                response.data.reduce(function (promise, product) {
                    return promise.then(function(result) {
                        return self.processProduct(product);
                    });
                }, $q.when());
            });
        });
    }

    this.processSingle = function(product) {
        var promises = [];
        promises.push(
            getCategories(),
            getSpecies(),
            getDescriptions(),
            getColors(),
            getSizes(),
            getBrands()
        );

        $q.all(promises).then(function(r) {
            self.processProduct(product);
        });
    }

    
    // The one function to rule them all
    this.processProduct = function(product) {
        var deferred = $q.defer();

        l("Now processing product: "+product.product_name +"(Item Number: "+product.item_number+")");

        targetProduct = product;
        targetProductWooData = {};

        // init some arrays we need
        targetProductWooData.meta_data = [];

        // first, load in all the extra data we need to access
        var promises = [];
        promises.push(
            self.processShortDescription(),
            self.processImages(),
            self.processPricing(),
            self.processLocations(),
            self.processMaster(),
            self.processCategories(),
            self.processSpecies(),
            self.processMetrics()
        );

        $q.all(promises).then(function() {
            // prepare our other woo Data
            targetProductWooData.name = targetProduct.product_name;
            targetProductWooData.regular_price = ""+targetProduct.master['Retail Price'];
            targetProductWooData.description = descriptions[targetProduct.item_number];
            targetProductWooData.sku = targetProduct.item_number;

            // make sure fineline is added to categories
            if (targetProduct.master.finelineCat !== null) {
                targetProductWooData.categories.push({id:targetProduct.master.finelineCat});
            }

            // if there's no cats, assign it to Miscellaneous
            if (targetProductWooData.categories.length == 0) {
                targetProductWooData.categories.push({id:1211});
            }
            
            var vo = targetProduct.master['Visible Online'];

            l("\tVisible online? "+vo);

            // check if the product should be visible online
            if (vo == 1 || vo == "1" || vo == "Yes" || vo == "yes") {
                // check if it's a simple or variable product
                if (product.master_sku !== null) {
                    // it's a variation
                    l("\tProduct is a variation");
                    // we need a parent ID, so get it or create it
                    self.wooGetOrCreateParent().then(function(parent) {
                        var parentData = {attributes: parent.attributes}
                        l("\t\tHave the parent with Woo ID: "+parent.id);

                        // set our child product data to the correct attributes
                        targetProductWooData.attributes = self.processVariables(targetProductWooData.attributes, 2);

                        // and make sure out parent has all the correct attributes too
                        parentData.attributes = self.processVariables(parentData.attributes, 1);

                        // before we create our variation, update the parent to make sure all atrributes exist
                        self.wooUpdateProduct(parent.id, parentData, false).then(function(response) {
                            // now we can create the child variation
                            l("\t\Create or update the variation with data:");
                            l(targetProductWooData);
                            self.wooCreateChildProduct(parent.id, targetProductWooData).then(function(response) {
                                l("\t\t\tFinished with the variation.");
                                l("***************************************");
                                deferred.resolve();
                            });
                        });
                    });

                } else { // else product.master_sku !== null
                    // it's a simple product
                    l("\tProduct is a simple product, create or update it with data:");
                    l(targetProductWooData);
                    self.wooCreateProduct(targetProductWooData, true).then(function(response) {
                        l("\t\tFinished with the simple product.");
                        l("***************************************");
                        deferred.resolve();
                    });

                } // endif product.master_sku !== null
            } else {
                // product shouldn't be visible online, make sure it isn't
                if (product.master_sku !== null) {
                    // delete the parent, the children go with it

                    // clean up products_variations
                } else {
                    // just delete the product

                }

                l("***************************************");
                deferred.resolve();
            }

        });

        return deferred.promise;
    }






    /*
     *
     *  PREPARATION FUNCTIONS
     * 
     */

    // process the short description from the feature_x fields
    this.processShortDescription = function() {
        var shortDesc = "";
        shortDesc += (targetProduct.feature_1 !== "") ? "<ul>" : "";
        shortDesc += (targetProduct.feature_1 !== "") ? "<li>"+targetProduct.feature_1+"</li>" : "";
        shortDesc += (targetProduct.feature_2 !== "") ? "<li>"+targetProduct.feature_2+"</li>" : "";
        shortDesc += (targetProduct.feature_3 !== "") ? "<li>"+targetProduct.feature_3+"</li>" : "";
        shortDesc += (targetProduct.feature_4 !== "") ? "<li>"+targetProduct.feature_4+"</li>" : "";
        shortDesc += (shortDesc !== "") ? "</ul>" : "";

        targetProductWooData.short_description = shortDesc;

        return $q.resolve().promise;
    }

    // load in the images, then process it into our Woo Data
    this.processImages = function() {
        var wooImages = [];
        if (typeof targetProduct.images == 'undefined') {
            targetProduct.images = [];
            var deferredImages = $q.defer();
            var i = 0;

            // get our images from the DB
            DS.getProductImagesBySKU(targetProduct['item_number']).then(function(response) {
                // update our target product
                targetProduct.images = response.data;

                // process it into woo data format
                var wooImages = [];
                targetProduct.images.forEach(function (cv,i,a,) {
                    if (cv.valid == 1) { // check it's valid
                        wooImages.push({
                            src: cv.image,
                            position: i
                        });
                        i++;
                    }
                });

                // assign to our woo data
                targetProductWooData.images = wooImages;

                deferredImages.resolve();
            })
            
            return deferredImages.promise;
        } else {
            return $q.resolve().promise;
        }
    }

    // load in the pricing table, and process it into woo meta
    this.processPricing = function() {
        if (typeof targetProduct.pricing == 'undefined') {
            targetProduct.pricing = [];
            var deferredPricing = $q.defer();

            // load in the products_locations table
            DS.getProductPricingBySKU(targetProduct['item_number']).then(function(response) {
                // update our target product
                targetProduct.pricing = response.data[0];

                var locNumbers = [1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,19,99];
                var wooMeta = [];

                // prepare all of the woo meta qa_xxx, rp_xxx, and pp_xxx
                locNumbers.forEach(function(locNum,i,a) {
                    wooMeta.push({
                        key: "q"+locNum, //"qa_"+("000"+locNum).slice(-3),
                        value: ""+targetProduct.pricing[locNum + " Quantity Available"]
                    });
                    wooMeta.push({
                        key: "p"+locNum, //"rp_"+("000"+locNum).slice(-3),
                        value: ""+targetProduct.pricing[locNum + " Retail Price"]
                    });
                    wooMeta.push({
                        key: "sp"+locNum, //"pp_"+("000"+locNum).slice(-3),
                        value: ""+targetProduct.pricing[locNum + " Promotion Price"]
                    });
                });

                // assign it to our woo data
                targetProductWooData.meta_data = targetProductWooData.meta_data.concat(wooMeta);

                deferredPricing.resolve();
            });

            return deferredPricing.promise;
        } else {
            return $q.resolve().promise;
        }
    }

    // load in the locations table, and process it into woo meta
    this.processLocations = function() {
        if (typeof targetProduct.locations == 'undefined') {
            targetProduct.locations = [];
            var deferredLocation = $q.defer();

            // load in the products_location_secondary table
            DS.getProductLocationsBySKU(targetProduct['item_number']).then(function(response) {
                // assign it to our target product
                targetProduct.locations = response.data[0];

                if (typeof targetProduct.locations !== "undefined" ){
                    var locNumbers = [1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,19,99];
                    var wooMeta = [];
    
                    // prepare all of the woo meta bin_xxx, loading_required_xxx, and order_point_xxx
                    locNumbers.forEach(function(locNum,i,a) {
                        wooMeta.push({
                            key: "bin_"+("000"+locNum).slice(-3),
                            value: ""+targetProduct.locations[locNum + " Location"]
                        });
                        wooMeta.push({
                            key: "loading_required_"+("000"+locNum).slice(-3),
                            value: ""+targetProduct.locations[locNum + " Loading Required?"]
                        });
                        wooMeta.push({
                            key: "order_point_"+("000"+locNum).slice(-3),
                            value: ""+targetProduct.locations[locNum + " Order Point"]
                        });
                    });

                    // assign it to our woo data
                    targetProductWooData.meta_data = targetProductWooData.meta_data.concat(wooMeta);
                }
                
                deferredLocation.resolve();
            });

            return deferredLocation.promise;
        } else {
            $q.resolve().promise;
        }
    }

    // load in the master table, and process it into woo meta
    this.processMaster = function() {
        if (typeof targetProduct.master == 'undefined') {
            targetProduct.master = []; // init the array
            var deferredMaster = $q.defer();

            // load in the products_master table
            DS.getProductMasterBySKU(targetProduct['item_number']).then(function(response) {
                // assign it to our target product
                targetProduct.master = response.data[0];

                // prepare our woo meta
                var wooMeta = [];
                wooMeta.push({
                    key: 'item_description',
                    value: targetProduct.master['Item Description']
                });
                wooMeta.push({
                    key: 'stocking_um',
                    value: targetProduct.master['Stocking U/M']
                });
                wooMeta.push({
                    key: 'discontinued',
                    value: ((targetProduct.master['Discontinued Item?']=='Y') ? "1" : "0")
                });
                wooMeta.push({
                    key: 'visible_online',
                    value: ((targetProduct.master['Visible Online']=='Yes') ? "1" : "0")
                });
                wooMeta.push({
                    key: 'quantity_break_code',
                    value: targetProduct.master['Quantity Break Code']
                });
                wooMeta.push({
                    key: 'mfg_part',
                    value: targetProduct.master['MFG Part #']
                });
                wooMeta.push({
                    key: 'display_in_catalog',
                    value: ((targetProduct.master['Display in iNet?']==2) ? "1" : "0")
                });
                wooMeta.push({
                    key: 'map_pricing',
                    value: targetProduct.master['iMap']
                });
                wooMeta.push({
                    key: 'purchase_um',
                    value: targetProduct.master['Purchase U/M']
                });
                wooMeta.push({
                    key: 'keep_stock_data',
                    value: ((targetProduct.master['Keep Stock Data?']=='Y') ? "1" : "0")
                });

                // assign it to our woo data
                targetProductWooData.meta_data = targetProductWooData.meta_data.concat(wooMeta);

                // figure out the fineline category
                if (targetProduct.master['Current Fineline Code'] !== null && targetProduct.master['Current Fineline Code'] !== 0) {
                    DS.findFineline(targetProduct.master['Current Fineline Code']).then(function(response) {
                        if (typeof response.data[0] !== "undefined") {
                            targetProduct.master.finelineCat = categories[response.data[0].pcat_id].woo_id
                        }

                        deferredMaster.resolve();
                    });
                } else {
                    targetProduct.master.finelineCat = null;
                }

                
            });

            return deferredMaster.promise;
        } else {
            $q.resolve().promise;
        }
    }

    // matches categories to the woo cat IDs
    this.processCategories = function() {
        var wooCats = [];
        if (targetProduct.added_category !== null) {
            targetProduct.added_category.forEach(function (cat,i,a) {
                if (typeof categories[cat] !== 'undefined') {
                    wooCats.push({id:categories[cat].woo_id});
                }
            });
        }

        targetProductWooData.categories = wooCats;

        return $q.resolve().promise;
    }

    // matches species to the woo term IDs
    this.processSpecies = function() {
        var wooSpecies = [];
        if (targetProduct.species_id !== null) {
            targetProduct.species_id.forEach(function(spc) {
                if (typeof species[spc] !== 'undefined') {
                    wooSpecies.push(species[spc].woo_id);
                }
            });

            targetProductWooData.species = wooSpecies;
        }

        return $q.resolve().promise;
    }

    // process the dimensions and weight
    this.processMetrics = function () {
        var wooDimensions = {
            length: ""+targetProduct.master['Item Depth'],
            width: ""+targetProduct.master['Item Width'],
            height: ""+targetProduct.master['Item Height']
        };

        targetProductWooData.dimensions = wooDimensions;
           
        // weight
        var wooWeight = null;
        if (targetProduct.master['Weight Unit'] == "TN") {
            wooWeight = targetProduct.master['Weight'] * 2000;
        } else if (targetProduct.master['Weight Unit'] == "OZ") {
            wooWeight = targetProduct.master['Weight']/16;
        } else if (targetProduct.master['Weight Unit'] == "GR") {
            wooWeight = targetProduct.master['Weight']*0.0022;
        } else {
            wooWeight = targetProduct.master['Weight'];
        }

        targetProductWooData.weight = ""+wooWeight;

        // bonus meta key _wc_local_pickup_plus_local_pickup_product_availability
        var wooMeta = [];
        if (wooWeight == 0 || wooWeight >= 150 || ((targetProduct.master['Item Depth']*targetProduct.master['Item Width']*targetProduct.master['Item Height'])==0)) {
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
        targetProductWooData.meta_data = targetProductWooData.meta_data.concat(wooMeta);

        return $q.resolve().promise;

    }

    // Proceesses size/color into various Woo meta format
    // Mode=1 for parent meta   
    //      attributes = [{name:'', options:[], visible:true, variation:true}]
    // Mode=2 for child meta
    //      attributes = [{name:'', option:''}]
    //
    this.processVariables = function(attributes=[], mode=1) {

        // can we just skip this?
        if (targetProduct.color_id !== null || targetProduct.size_id !== null) {
            if (attributes.length == 0 && mode==1) {
                // no options, so just init what we need
                attributes = [{name: 'Color', options: []}, {name: 'Size', options: []}];
            } else if (attributes.length == 0 && mode==2) {
                // no options, so just init what we need
                attributes = [{name: 'Color'}, {name: 'Size'}];
            }

            // go through each existing attribute array
            attributes.forEach(function (attribute) {

                // process color if we have to
                if (attribute.name == "Color" && targetProduct.color_id !== null) {
                    // we check if it's already in the attributes, so we don't have dupes
                    if ($.inArray(""+colors[targetProduct.color_id], attribute.options) == -1 && mode==1) {
                        attribute.options.push(""+colors[targetProduct.color_id]);
                    } else {
                        attribute.option = ""+colors[targetProduct.color_id];
                    }

                    // if this is for a parent, we need a couple extra things
                    if (mode==1) {
                        attribute.visible = true;
                        attribute.variation = true;
                    }
                }

                // process size if we have to
                if (attribute.name == "Size" && targetProduct.size_id !== null) {
                    // we check if it's already in the attributes, so we don't have dupes
                    if ($.inArray(""+sizes[targetProduct.size_id], attribute.options) == -1 && mode==1) {
                        attribute.options.push(""+sizes[targetProduct.size_id]);
                    } else {
                        attribute.option = ""+sizes[targetProduct.size_id];
                    }

                    // if this is for a parent, we need a couple extra things
                    if (mode==1) {
                        attribute.visible = true;
                        attribute.variation = true;
                    }
                }

            });

            // return our processed array
            return attributes;
        }
        
        // skipped, so just return what was sent
        return attributes;
    }



    

    /*
     *
     * WOO API FUNCTIONS
     * 
     */

    // this is going to look for an existing parent, and retrieve it or create it
    this.wooGetOrCreateParent = function() {
        var deferred = $q.defer();

        DS.getProductVariations(targetProduct.master_sku).then(function(response) {
            if (response.data.length == 0) {
                // no parent exists, create one
                var parentData = {};
                angular.copy(targetProductWooData, parentData);
                parentData.sku = null;
                parentData.type = "variable";

                parentData.attributes = self.processVariables(parentData.attributes, 1);

                l("\t\tCreating a parent product with data:");
                l(parentData);

                DS.wooCreateProduct(parentData).then(function(response) {
                    response = JSON.parse(response.data);
                    var parent = response;

                    DS.wooAssignTerms(parent.id, parentData.species).then(function(res) {
                        var data = {
                            "table": "products_variations",
                            "values": {
                                master_sku: targetProduct.master_sku,
                                woo_parent: parent.id
                            }
                        };

                        DS.createRecord(data).then(function(response) {
                            deferred.resolve(parent);
                        });
                    });
                    
                });
            } else {
                l("\t\tFound an existing parent product.");
                DS.wooGetProduct(response.data[0].woo_parent).then(function(response) {
                    var parent = response.data;
                    deferred.resolve(parent);
                });
            }
        });

        return deferred.promise;
    }

    this.wooUpdateProduct = function(targetID, data, notify=true) {
        var deferred = $q.defer();

        DS.wooUpdateProduct(targetID, data).then(function(response) {
            response = JSON.parse(response.data);

            if (typeof response.id !== 'undefined') {
                DS.wooAssignTerms(response.id, targetProductWooData.species);
            }

            // check the response
            if (typeof response.id !== 'undefined') {
                // product was created
                l("\t\tUpdated the product as it already existed, Woo ID: "+response.id);
            } else if (response.code === "product_invalid_sku") {
                // product probably exists already
                l("\t\t!!! Couldn't find the product to be updated.");
            } else {
                // Something unexpected happened
                l("!!! Something wen't wrong within wooUpdateProduct(), here's the response:");
                l(response);
            }

            deferred.resolve();
        });

        return deferred.promise;
    }

    this.wooUpdateChildProduct = function(parentID, childID, data, notify=true) {
        var deferred = $q.defer();

        DS.wooUpdateChildProduct(parentID, childID, data).then(function(response) {
            response = JSON.parse(response.data);

            if (typeof response.id !== 'undefined') {
                DS.wooAssignTerms(parentID, targetProductWooData.species);
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

            deferred.resolve();
        });

        return deferred.promise;
    }

    this.wooCreateChildProduct = function(parentID, data, notify=true) {
        var deferred = $q.defer();

        DS.wooCreateProductVariation(parentID, data).then(function(response) {
            response = JSON.parse(response.data);

            if (typeof response.id !== 'undefined') {
                DS.wooAssignTerms(parentID, targetProductWooData.species);
            }

            // check the response
            if (typeof response.id !== 'undefined') {
                // product was created
                // *** todo: set the flag
                l("\t\t\tCreated with Woo ID: "+response.id);
                deferred.resolve();
            } else if (response.code === "product_invalid_sku") {
                // product probably exists already
                self.wooUpdateChildProduct(parentID, response.data.resource_id, data).then(function(response) {
                    deferred.resolve();
                });
            } else {
                // Something unexpected happened
                l("!!! Something wen't wrong within wooCreateChildProduct(), here's the response:");
                l(response);
                deferred.resolve();
            }

        });  // end DS.wooCreateProduct

        return deferred.promise;
    }


    this.wooCreateProduct = function(data, notify=true) {
        var deferred = $q.defer();

        DS.wooCreateProduct(data).then(function(response) {
            response = JSON.parse(response.data);

            if (typeof response.id !== 'undefined') {
                DS.wooAssignTerms(response.id, targetProductWooData.species);
            }

           
            if (typeof response.id !== 'undefined') {
                // product was created
                // *** todo: set the flag
                l("\t\tCreated with Woo ID: "+response.id);
                deferred.resolve();
            } else if (response.code === "product_invalid_sku") {
                // product probably exists already
                // *** todo: add in update function
                self.wooUpdateProduct(response.data.resource_id, data).then(function(response) {
                    deferred.resolve();  
                });
            } else {
                // Something unexpected happened
                l("!!! Something wen't wrong within wooCreateProduct(), here's the response:");
                l(response);
                deferred.resolve();
            }
    
        });  // end DS.wooCreateProduct

        return deferred.promise;
    }

    var l = function(message) {
        if (debug) {
            console.log(message);
        }
    }

    function getDescriptions() {
        var deferred = $q.defer();
        DS.getProductDescriptions().then(function(response) {
            response.data.map(function(cv,i,a) {
                descriptions[cv.item_number] = cv.full_desc;
            });
            deferred.resolve();
        })
        return deferred.promise;
    }
    
    function getBrands() {
        var deferred = $q.defer();
	    DS.getProductBrands().then(function(response) {
	    	response.data.map(function(cv,i,a) {
		    	brands[cv.id] = cv.brand_name;
            });
            deferred.resolve();
        });
        return deferred.promise;
    }
    
    function getCategories() {
        var deferred = $q.defer();
	    DS.getProductCategories().then(function(response) {
	    	response.data.map(function(cv,i,a) {
		    	categories[cv.id] = cv;
            });
            deferred.resolve();
        });
        return deferred.promise;
    }
    
    function getSpecies() {
        var deferred = $q.defer();
	    DS.getProductSpecies().then(function(response) {
	    	response.data.map(function(cv,i,a) {
		    	species[cv.id] = cv;
            });
            deferred.resolve();
        });
        return deferred.promise;
    }

    function getSizes() {
        var deferred = $q.defer();
        DS.getProductSizes().then(function(response) {
		    response.data.map(function(cv,i,a) {
		    	sizes[cv.id] = cv.size_name;
            });
            deferred.resolve();
        });
        return deferred.promise;
    }
    
    function getColors() {
        var deferred = $q.defer();
	    
	    DS.getProductColors().then(function(response) {
		    response.data.map(function(cv,i,a) {
		    	colors[cv.id] = cv.name;
            });
            deferred.resolve();
        });
        
        return deferred.promise;
    }

}]);