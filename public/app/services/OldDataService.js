'use strict';

app.service('OldDataService', ['$http', 'MessagingService', 'DataService.api', 'authService', '$q', function ($http, MS, DS, authService, $q, angularAuth0) {
    
    var sizes = [];
    var colors = [];
    var species = [];

    var self = this;

    this.run = function() {
        var promises = [];

        promises.push(
            getSizes(),
            getColors(),
            getSpecies()
        );

        $q.all(promises).then(function(response) {
            DS.getProducts().then(function(response) {
                var total = response.data.length;
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
                
                var i = 1;
                response.data.reduce(function (promise, product) {
                    return promise.then(function(result) {
                        i++;
                        return self.processAll(product, i, total);
                    });
                }, $q.when());
            });
        })
    }

    this.processAll = function(data, i, total) {
        var deferred = $q.defer();
        var promises = [];

        console.log("Processing: "+data.item_number+"("+i+"/"+total+")");

        promises.push(
            self.processSizeData(data),
            self.processColorData(data),
            self.processSpeciesData(data)
        );

        $q.all(promises).then(function(response) {
            deferred.resolve();
        })

        return deferred.promise;
    }

    this.processSizeData = function (data, deferred = null) {
        if (deferred == null) {
            deferred = $q.defer();
        }

        console.log("\tprocessSizeData");

        if (data.size_id == null) {
            if (data.size !== null) {
                data.size = data.size.replace(/\\'/g, "'");
                data.size = data.size.replace(/\\"/g, '"');

                // we need to process the old size data
                // so try to find the old size in products_sizes table
                var sizeID = sizes.find(function (data2) {
                    return data2.size_name == data.size;
                });

                // did we find an ID?
                if (sizeID !== undefined) {
                    data.size_id = sizeID.id;
                    DS.updateProduct(data).then(function(response) {
                        deferred.resolve();
                    });
                }
                else {
                    data.size = data.size.replace(/\'/g, "\\'");
                    data.size = data.size.replace(/\"/g, '\\"');
                    var newSize = {
                        size_name: data.size,
                    };
                    createSize(newSize).then(function() {
                        getSizes().then(function() {
                            self.processSizeData(data, deferred);
                        });
                    });
                }
            } else {
                // no size, so we're done here
                deferred.resolve();
            }
        } else {
            // size_id is set, so we're done here
            deferred.resolve();
        }
        return deferred.promise;
    };

    this.processColorData = function (data, deferred = null) {
        if (deferred == null) {
            deferred = $q.defer();
        }
        console.log("\tprocessColorData");

        if (data.color_id == null) {
            if (data.color !== null) {
                // we need to process the old color data
                // so try to find the old color in product_colors table
                var colorID = colors.find(function (data2) {
                    return data2.name == data.color;
                });

                // did we find an ID?
                if (colorID !== undefined) {
                    data.color_id = colorID.id;
                    DS.updateProduct(data).then(function(response) {
                        deferred.resolve();
                    });
                }
                else {
                    var newColor = {
                        name: data.color,
                    };
                    createColor(newColor).then(function() {
                        getColors().then(function() {
                            self.processColorData(data, deferred);
                        });
                    });
                }
            } else {
                // no color, so we're done here
                deferred.resolve();
            }
        } else {
            // color_id is set, so we're done here
            deferred.resolve();
        }
        return deferred.promise;
    };

    this.processSpeciesData = function (data, deferred = null) {
        if (deferred == null) {
            deferred = $q.defer();
        }
        console.log("\tprocessSpeciesData");

        if (data.species_id == null) {
            if (data.species !== null) {

                data.species = data.species.toUpperCase();
                // we need to process the old species data
                // old data is stored as FIRST;SECOND;THIRD, so let's split it into an array
                var ourspecies = data.species.split(';');
                var speciesIDs = [];
                var speciesToCreate = [];
                var alldone = true;


                // now for each species, we need to run our check
                ourspecies.forEach(function(cv, i, a) {
                    // try to find the old species in products_species table
                    var speciesID = species.find(function (data2) {
                        return data2.species_name == cv;
                    });

                    // did we find an ID?
                    if (speciesID !== undefined) {
                        speciesIDs.push(speciesID.id);
                    }
                    else {
                        speciesToCreate.push(cv);
                        alldone = false;
                    }
                });

                if (alldone) {
                    // now we need to update data to include the new speciesIDs
                    data.species_id = JSON.stringify(speciesIDs);
                    DS.updateProduct(data).then(function(response) {
                        deferred.resolve();
                    });
                } else {
                    // we have species to create
                    var promises = [];

                    angular.forEach(speciesToCreate, function(cv,i,a) {
                        var newSpecies = {
                            species_name: cv,
                        };
                        promises.push(createSpecies(newSpecies));
                    });

                    $q.all(promises).then(function() {
                        getSpecies().then(function() {
                            self.processSpeciesData(data, deferred);
                        });
                    });
                }
            } else {
                // no size, so we're done here
                deferred.resolve();
            }
        } else {
            // size_id is set, so we're done here
            deferred.resolve();
        }
        return deferred.promise;
    };





    function getSizes() {
        var deferred = $q.defer();
        DS.getProductSizes().then(function(response) {
            sizes = response.data;
            sizes.forEach(function(size) {
                size.size_name = size.size_name.replace(/\\'/g, "'");
                size.size_name = size.size_name.replace(/\\"/g, '"');
            });
            deferred.resolve();
        });
        return deferred.promise;
    }

    function createSize(newSize) {
        var data = {
            "table": "products_sizes",
            "values": newSize
        };

        return DS.createRecord(data)
            .finally(function () {
            });
    };




    function getColors() {
        var deferred = $q.defer();
        DS.getProductColors().then(function(response) {
            colors = response.data;
            deferred.resolve();
        });
        return deferred.promise;
    }

    function createColor(newColor) {
        var data = {
            "table": "products_colors",
            "values": newColor
        };

        return DS.createRecord(data)
            .finally(function () {
            });
    };




    function getSpecies() {
        var deferred = $q.defer();
	    DS.getProductSpecies().then(function(response) {
            species = response.data;
            var rerun = false;
            
            var promises = [];
            species.forEach(function(species) {
                if (species.woo_id == null) {
                    species.species_name = species.species_name.toUpperCase();
                    rerun = true;

                    var def = $q.defer();
                    DS.wooAddTerm(species.species_name).then(function(response) {
                        // it got created
                        species.woo_id = response.data.id;
                        DS.updateRecord({
                            table: 'products_species',
                            values: species
                        }).then(function(response) {
                            def.resolve();
                        });
                    }, function(err) {
                        // it exists, find it and update the woo_id
                        DS.wooGetSpecies().then(function(response) {
                            console.log(response.data);
                            var theSpecies = response.data.filter(function(test) {
                                return test.name == species.species_name;
                            });
                            species.woo_id = theSpecies[0].id
                            DS.updateRecord({
                                table: 'products_species',
                                values: species
                            }).then(function(response) {
                                def.resolve();
                            });
                        });
                    });

                    promises.push(def.promise);
                }
            });

            $q.all(promises).then(function() {
                deferred.resolve();   
                if (rerun) { getSpecies(); }             
            });
	    });
        return deferred.promise;
    }

    function createSpecies(newSpecies) {
        var data = {
            "table": "products_species",
            "values": newSpecies
        };

        return DS.createRecord(data)
            .finally(function () {
            });
    };

}]);