/**
/**
 * Created by Corey on 8/8/17.
 */
'use strict';

app.controller('ProductsCtrl', ['$scope', '$sce', '$rootScope', 'DataService.api', 'WooService', 'MessagingService', 'authService', '$q', function ($scope, $sce, $rootScope, DS, WS, MS, authService, $q) {
    $scope.tinymceOptions = {
        theme: 'modern',
        resize: true,
        plugins: 'lists advlist powerpaste blockquote searchreplace autolink numlist bullist directionality hr advcode visualblocks visualchars fullscreen unlink image link media template paste codesample table charmap hr pagebreak nonbreaking anchor toc insertdatetime textcolor wordcount tinymcespellchecker a11ychecker imagetools mediaembed  linkchecker contextmenu colorpicker textpattern help',
        toolbar1: 'bold italic strikethrough | numlist bullist | blockquote | hr | alignleft aligncenter alignright | link | unlink',
        toolbar2: 'formatselect | forecolor | pastetext | removeformat | charmap | outdent indent',
        advlist_bullet_styles: "circle",
        menubar: false,
        statusbar: true,
        content_css: [
            '//fonts.googleapis.com/css?family=Lato:300,300i,400,400i',
            '//www.tinymce.com/css/codepen.min.css'
        ]

    };
    var vm = this;
    vm.auth = authService;

    $scope.offset = 0;
    var offset_increment = 50;

    var utilityOffset = 0;
    var utilityOffsetIncrement = 100;

    var page = 1;

    $scope.scrollMode = true;

    $scope.currentData = [];

    $scope.currentProductData = [];

    $scope.currentExisitingProductData = [];

    $scope.selectedFilter = "None";

    $scope.dayDateFormat = 'yyyy-MM-dd';

    $scope.timeDateFormat = 'MMM d, y';

    $scope.selectedConsumerTypeID = -1;

    $scope.selectedUtilityID = -1;

    $scope.selectedUtility = null;

    $scope.selectedConsumerType = null;

    $scope.utilityFilter = -1;

    $scope.utilitySelect = {};

    $scope.consumerTypeSelect = {};


    $scope.view = {
        record: {},
        highlightedItem: {},
        message: {},
        existingRecord: false,
        screen: 'single'
    };
    
    $scope.nav = {
	    options: [
	    	{
	    		label: "E-Commerce Content",
				screen: "single"
			}, 
			{
				label: "Media Gallery",
				screen: "media"
			},
			{
				label: "Fulfilment & Logistics",
				screen: "fulfilment"
			},
			{
				label: "Pricing",
				screen: "pricing"
			},
			{
				label: "Inventory",
				screen: "inventory"
			},
			{
				label: "Master Data",
				screen: "master"
			},
			{
				label: "Location Specific",
				screen: "location"
			},
			{
				label: "UPC / Secondary Lookup",
				screen: "lookup"
			},
			//{
			//	label: "Revisions",
			//	screen: "revisions"
			//}
		],
	    selectedIndex: 0
    }

    $scope.data = [];
    $scope.products = [];
    $scope.existingProductIDs = [];
    $scope.letters = [];
    $scope.form = {
        edit: false,
        master: {},
        user: {},
        activeclass: ''
    };

    $scope.descriptions = [];
    $scope.descriptionsIDs = [];
    
    $scope.brands = [];
    $scope.brandIDs = [];
    $scope.selectedBrand = [];
    
    $scope.categories = [];
    $scope.categoriesIDs = [];
    $scope.selectedCategory = [];
    
    $scope.species = [];
    $scope.speciesIDs = [];
    $scope.selectedSpecies = [];
    
    $scope.selectedParent = [];
    $scope.sizes = [];
    $scope.sizesIDs = [];
    $scope.selectedSize = [];
    $scope.colors = [];
    $scope.colorsIDs = [];
    $scope.selectedColor = [];
    
    getProducts();
    getDescriptions();
    getBrands();
    getCategories();
    //getSpecies();
    getVariable();

    $scope.prepareDescriptioForSave = function (data) {
        return data.replace(/<ul>/g, '<ul type="circle" style="list-style-type: circle;">').replace(/'/g, "\\'");
    };

    $scope.toTrusted = function(html_code) {
        return $sce.trustAsHtml(html_code);
    };

    $scope.productsGrid = { 
    	infiniteScrollDown: true,
    	enableRowSelection: true,
    	enableFullRowSelection: true,
    	enableRowHeaderSelection: false,
    	multiSelect: false,
		columnDefs: [
			{ field: "item_number", displayName: "SKU", width: 130 },
			{ field: "product_name", displayName: "Product Name" },
			{ field: "ic1", displayName: "ic1", width: 25, headerCellTemplate: "<span class='wicon-shop'></span>", cellTemplate: "<span class='wicon-shop' ng-if='row.entity.ic1 == true'></span>" },
			{ field: "ic2", displayName: "ic2", width: 25, headerCellTemplate: "<span class='wicon-tag'></span>", cellTemplate: "<span class='wicon-tag' ng-if='row.entity.ic2 == true'></span>" },
			{ field: "ic3", type: 'boolean', displayName: "ic3", width: 25, headerCellTemplate: "<span class='wicon-edit'></span>", cellTemplate: "<span class='wicon-edit' ng-if='row.entity.ic3 == true'></span>" },
		],
		rowHeight: 49,	
		enableSorting: false,
		enableColumnMenus: false,
		data: 'products',
		onRegisterApi: function(gridApi){ 
			$scope.gridApi = gridApi;
			gridApi.selection.on.rowSelectionChanged($scope, function(row) {
				$scope.loadClickedRecord(row);
			});
		}
	};



    function getProducts(callback) {

        DS.getProducts().then(processProducts);
        if (callback) {
            callback();
        }
    }

    function getExistingProducts(callback) {
        DS.getExistingProducts().then(processExistingProducts);
    }

    function processProducts(response) {

        let tmp = [];
        /*response.data.sort(function (a, b) {
            let textA = a.utName.toUpperCase();
            let textB = b.utName.toUpperCase();
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });*/

        // un-JSON our data
        response.data.forEach(function(cv,i,a) {
            try {
                cv.species_id = JSON.parse(cv.species_id);
            } catch(e) {
                console.log("Species isn't valid data");
            }
            try {
                if (cv.added_category == null) {
                    cv.added_category = [];
                } else {
                    cv.added_category = JSON.parse(cv.added_category);
                }
            } catch(e) {
                console.log("Added category isn't valid data");
            }
            try {
                if (cv.related_skus == null) {
                    cv.related_skus = [];
                } else {
                    cv.related_skus = JSON.parse(cv.related_skus);
                }
            } catch(e) {}

            // clean punctuation
            var cleanFields = ['product_name', 'feature_1', 'feature_2', 'feature_3', 'feature_4'];
            cleanFields.forEach(function(cf,i,a) {
                if (cv[cf] !== null) {
                    cv[cf] = cv[cf].replace(/\\'/g, "'");
                    cv[cf] = cv[cf].replace(/\\"/g, '"');
                }
            });
        });

        $scope.products = [];
        $scope.products = response.data;
    }

    function getDescriptions() {
        DS.getProductDescriptions().then(function(response) {
            response.data.map(function(cv,i,a) {
                $scope.descriptionsIDs[cv.item_number] = cv.full_desc;
            });
            $scope.descriptions = response.data;
        })
    }
    
    function getBrands() {
	    DS.getProductBrands().then(function(response) {
	    	response.data.map(function(cv,i,a) {
		    	$scope.brandIDs[cv.id] = cv.brand_name;
	    	});
			$scope.brands = response.data;
	    });
    }
    
    function getCategories() {
	    DS.getProductCategories().then(function(response) {
	    	response.data.map(function(cv,i,a) {
		    	$scope.categoriesIDs[cv.id] = cv;
	    	});
            $scope.categories = response.data;
            createHierarchicalCategories();
            console.log($scope.fCategories); // this is the hierarhical array structure, flattened for use in ng-repeater
	    });


    }

    // takes all categories and creates a hierarchical structure
    function createHierarchicalCategories() {
        function categoryDFS(parent) {
            parent.subCategories = [];
            for (var i = 0; i < $scope.categories.length; i++) {
                if ($scope.categories[i].parent_id == parent.id) {
                    parent.subCategories.push(categoryDFS($scope.categories[i]));
                }
            }
            return parent;
        }
        $scope.hCategories = [];
        $scope.fCategories = [];
        for (var i = 0; i < $scope.categories.length; i++) {
            if ($scope.categories[i].parent_id == null) {
                $scope.hCategories.push(categoryDFS($scope.categories[i]));
            }
        }
        flattenHierarchicalCategories();
    }

    // ng-repeat works much easier with a non-nested structure, so this
    //   flattens out the hierarhical structure into a single depth array
    function flattenHierarchicalCategories() {
        function flatten(parent) {
            for (var i = 0; i < parent.subCategories.length; i++) {
                parent.subCategories[i].depth = parent.depth + 1;
                $scope.fCategories.push(parent.subCategories[i]);
                flatten(parent.subCategories[i]);
            }
        }
        for (var i = 0; i < $scope.hCategories.length; i++) {
            $scope.hCategories[i].depth = 0;
            $scope.fCategories.push($scope.hCategories[i]);
            flatten($scope.hCategories[i]);
        }
    }

    function getSpecies() {
        var deferred = $q.defer();
	    DS.getProductSpecies().then(function(response) {
	    	response.data.map(function(cv,i,a) {
		    	$scope.speciesIDs[cv.id] = cv;
	    	});
            $scope.species = response.data;
            var rerun = false;
            
            var promises = [];
            $scope.species.forEach(function(species) {
                if (species.woo_id == null) {
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
    
    function getVariable() {
        var deferred = $q.defer();
	    // get size and color
	    DS.getProductSizes().then(function(response) {
		    response.data.map(function(cv,i,a) {
		    	$scope.sizesIDs[cv.id] = cv.size_name;
	    	});
            $scope.sizes = response.data;
	    });
	    DS.getProductColors().then(function(response) {
		    response.data.map(function(cv,i,a) {
		    	$scope.colorsIDs[cv.id] = cv.name;
            });
            $scope.colors = response.data;
            deferred.resolve();
        });
        
        return deferred.promise;
    }

    function processExistingProducts(response) {


        var temp = $scope.products;

        angular.forEach(response.data, function (value, key) {
            $scope.existingProductIDs.push(value["Item Number"]);
        });


        temp = temp.filter(function (item) {

            return $scope.existingProductIDs.indexOf(item["Item Number"]) !== -1;

        });

        $scope.currentExisitingProductData = temp;


    }


    $scope.loadMore = function () {
        if ($scope.scrollMode && $scope.data.length !== 0) {
            var temp = $scope.data.slice($scope.offset, $scope.offset + offset_increment);

            angular.forEach(temp, function (value, key) {
                $scope.currentData.push(value);
            });

            $scope.offset += offset_increment;
        }
    };

    $scope.loadMoreProducts = function () {
    	page = page + 1;
    	var results = getProducts(page);
    	
        if (results.length !== 0) {
            $scope.gridApi.infiniteScroll.saveScrollPercentage();
            $scope.products = $scope.products.concat(results);
            return $scope.gridApi.infiniteScroll.dataLoaded(false, true);
        }
    };

    $scope.loadClickedRecord = function (data) {

        if ($scope.form.edit) {
            //if we are in edit mode, don't allow changing of records
            return false;
        }

        $scope.loadSingleView(data);
        
        // reset the screen
        $scope.changeScreen(0, "single");
    };
    

    $scope.loadSingleView = function (data) {
        if (data && data.entity) {
            $scope.processColorData(data.entity).then(function() {
                $scope.processSizeData(data.entity).then(function() {
                    $scope.processSpeciesData(data.entity).then(function() {
                        $scope.form.master = data.entity;
                        angular.copy($scope.form.master, $scope.form.user);
                        $scope.view.record = data.entity;

                        console.log($scope.form.user.added_category);

                        // reset selections
                        $scope.selectedSize = [];
                        $scope.selectedColor = [];
                        $scope.selectedSize = [];
                        $scope.selectedParent = [];
                        $scope.selectedCategory = [];

                        // get master data
                        DS.getProductMasterBySKU($scope.form.user['item_number']).then(function(response) {
                            $scope.form.master.master = response.data[0];
                            $scope.form.user.master = angular.copy($scope.form.master.master);
                            $scope.view.record.master = response.data[0];
                         });

                        

                        // select the right brand
                        $scope.selectedBrand = $scope.brands.find(function(data) {
                            return data.id == $scope.form.user.brand_id;
                        });

                        // select the right color
                        $scope.selectedColor = $scope.colors.find(function(data2) {
                            return data2.id == $scope.form.user.color_id;
                        });

                        // select the right size
                        $scope.selectedSize = $scope.sizes.find(function(data2) {
                            return data2.id == $scope.form.user.size_id;
                        });

                        // select the right parent
                        if ($scope.form.user.parent_id !== null) {
                            DS.getProductsBySKU($scope.form.user.parent_id).then(function(response) {
                                $scope.selectedParent = response.data[0];
                            });
                        }
                        
                    });
                });
            });
        }
        else {
            console.log("Data for single view not supplied.");
        }
    };

    /*
    * Process new Color relationship if color_id not set
    */
    $scope.processColorData = function (data, deferred = null) {
        if (deferred == null) {
            deferred = $q.defer();
        }

        if (data.color_id == null) {
            if (data.color !== null) {
                // we need to process the old color data
                // so try to find the old color in product_colors table
                var colorID = $scope.colors.find(function (data2) {
                    return data2.name == data.color;
                });

                // did we find an ID?
                if (colorID !== undefined) {
                    data.color_id = colorID.id;
                    $scope.selectedColor = colorID;
                    // TODO: maybe run an update on the products record here, otherwise this will keep running until the record is updated
                    deferred.resolve();
                }
                else {
                    var newColor = {
                        name: data.color,
                    };
                    $scope.createColor(newColor).then(function() {
                        getVariable().then(function() {
                            $scope.processColorData(data, deferred);
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

    /*
    * Process new Size relationship if size_id not set
    */
    $scope.processSizeData = function (data, deferred = null) {
        if (deferred == null) {
            deferred = $q.defer();
        }

        if (data.size_id == null) {
            if (data.size !== null) {
                // we need to process the old size data
                // so try to find the old size in products_sizes table
                var sizeID = $scope.sizes.find(function (data2) {
                    return data2.size_name == data.size;
                });

                // did we find an ID?
                if (sizeID !== undefined) {
                    data.size_id = sizeID.id;
                    $scope.selectedSize = sizeID;
                    // TODO: maybe run an update on the products record here, otherwise this will keep running until the record is updated
                    deferred.resolve();
                }
                else {
                    var newSize = {
                        size_name: data.size,
                    };
                    $scope.createSize(newSize).then(function() {
                        getVariable().then(function() {
                            $scope.processSizeData(data, deferred);
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

    /*
    * Process new Species relationship if species_id not set
    */
    $scope.processSpeciesData = function (data, deferred = null) {
        if (deferred == null) {
            deferred = $q.defer();
        }

        if (data.species_id == null) {
            if (data.species !== null) {
                // we need to process the old species data
                // old data is stored as FIRST;SECOND;THIRD, so let's split it into an array
                var species = data.species.split(';');
                var speciesIDs = [];
                var speciesToCreate = [];
                var alldone = true;

                // now for each species, we need to run our check
                species.forEach(function(cv, i, a) {
                    // try to find the old species in products_species table
                    var speciesID = $scope.species.find(function (data2) {
                        return data2.species_name == cv;
                    });

                    // did we find an ID?
                    if (speciesID !== undefined) {
                        speciesIDs.push(speciesID.id);
                        $scope.selectedSpecies.push(speciesID);
                        // TODO: maybe run an update on the products record here, otherwise this will keep running until the record is updated
                        deferred.resolve();
                    }
                    else {
                        speciesToCreate.push(cv);
                        alldone = false;
                    }
                });

                if (alldone) {
                    // now we need to update data to include the new speciesIDs
                    data.species_id = speciesIDs;
                } else {
                    // we have species to create
                    var promises = [];

                    angular.forEach(speciesToCreate, function(cv,i,a) {
                        var newSpecies = {
                            species_name: cv,
                        };
                        promises.push($scope.createSpecies(newSpecies));
                    });

                    $q.all(promises).then(function() {
                        getSpecies().then(function() {
                            $scope.processSpeciesData(data, deferred);
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

    $scope.editModeToggle = function () {
        $scope.view.existingRecord = true;
        //copy our master to our user editable object
        angular.copy($scope.form.master, $scope.form.user);

        //toggle our edit state to the reverse of whatever it was
        $scope.form.edit = !$scope.form.edit;

        //manage class for frontend styles
        if ($scope.form.edit == true) {
            $scope.form.activeclass = 'editing';

            // setup Selects
            $(document).ready(function() {
	            $('#brand, #categories, #species, #relatedSKUs').select2({
		            placeholder: 'Please select'
	            });
	            $('#size, #color').select2({
		            placeholder: 'Please select',
	            });
	            $('#masterProduct').select2({
                    ajax: {
                        url: '/api/v1/products/lookup',
                        dataType: 'json',
                        processResults: function (data) {
                           return {
                             results: data
                           };
                         }
                    },
                    placeholder: ($scope.selectedParent !== undefined ? $scope.selectedParent.item_number+" "+$scope.selectedParent.product_name : 'Search for SKU'),
                    minimumInputLength: 3,
                 }).on('change', function() {
                     var scope = angular.element($(this)).scope();
                     scope.$apply(function() {
                         $scope.form.user.parent_id = $('#masterProduct').select2('val');
                     });
                 });
                 $('#relatedSKUs').select2({
                    ajax: {
                        url: '/api/v1/products/lookup',
                        dataType: 'json',
                        processResults: function (data) {
                           return {
                             results: data
                           };
                         }
                    },
                    placeholder: 'Search for SKU',
                    minimumInputLength: 3,
                 }).on('change', function() {
                     var scope = angular.element($(this)).scope();
                     scope.$apply(function() {
                        scope.addRelated($('#relatedSKUs').select2('val'));
                     });
                 });
            });
        }
        else {
            $scope.form.activeclass = '';
        }
    };


    $scope.updateSingleProduct = function () {
        // JSONify our arrays
        $scope.form.user.species_id = JSON.stringify($scope.form.user.species_id);

        if ($scope.form.user.added_category && $scope.form.user.added_category.length == 0) {
            $scope.form.user.added_category = null;
        } else {
            $scope.form.user.added_category = JSON.stringify($scope.form.user.added_category);
        }

        if ($scope.form.user.related_skus && $scope.form.user.related_skus.length == 0) {
            $scope.form.user.related_skus = null;
        } else {
            $scope.form.user.related_skus = JSON.stringify($scope.form.user.related_skus);
        }

        var data = {
            item_number: $scope.form.user.item_number,
            full_desc: $scope.prepareDescriptioForSave($scope.descriptionsIDs[$scope.form.user.item_number])
        };

        // whenever we update a product, redo a full sync of it
        $scope.form.user.sync_to_woo = 1;

        DS.updateProductDescription(data)
            .finally(function() {
                DS.updateProduct($scope.form.user)
                    .then(updateSuccess, updateFailure)
                    .finally(function () {
                        console.log("finally");
                    });
            });
        
        
    };


    function updateSuccess(response) {
        console.info("Update successful");
        console.log(response);

        let message = {
            id: Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36),
            text: '',
            type: 'success',
            platform: 'server'
        };

        //find out what kind of operation we were successful at
        if (response.config.url.indexOf('delete') >= 0) {
            message.text = 'Record deleted!';
            $scope.loadSingleView({record: {}});
        }
        else if (response.config.url.indexOf('new') >= 0) {
            message.text = 'Record created!';
            getProducts();
            $scope.loadSingleView({record: response.data.values});
        }
        else if (response.config.url.indexOf('update') >= 0) {
            message.text = 'Record updated!';
        	getProducts();
			$scope.loadSingleView({entity: response.data.values});
        }
        else {
            message.text = 'Success!';
            getProducts();
            $scope.loadSingleView({record: {}});
        }

        DS.wooFullSyncSingle($scope.form.user.item_number);

        $scope.editModeToggle();
        MS.addMessage(message);
    }

    function updateFailure(response) {

        var message = {
            id: Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36),
            text: 'Unable to complete operation.',
            type: 'warning',
            platform: 'server'
        };

        MS.addMessage(message);
        $scope.editModeToggle();
        getProducts();

    }


    $scope.createRecordResponse = function () {
        console.log("Complete");
    };

    $scope.addNewRecord = function () {
        $scope.form.user = {};

        $scope.view.existingRecord = false;

        //toggle our edit state to the reverse of whatever it was
        $scope.form.edit = !$scope.form.edit;

        //manage class for frontend styles
        if ($scope.form.edit == true) {
            $scope.form.activeclass = 'editing';
        }
        else {
            $scope.form.activeclass = '';
        }

    };

    $scope.deleteSingleConsumer = function () {
        console.info('deleting util0ity...');
        DS.deleteConsumer($scope.view.record)
            .then(updateSuccess, updateFailure)
            .finally(function () {
                console.log("finally");
            });
    };


    $scope.addNewRecord = function () {
        $scope.view.record = {};
        $scope.form.user = {};
        $scope.selectedUtility = null;


        $scope.view.existingRecord = false;

        //toggle our edit state to the reverse of whatever it was
        $scope.form.edit = !$scope.form.edit;

        //manage class for frontend styles
        if ($scope.form.edit == true) {
            $scope.form.activeclass = 'editing';
        }
        else {
            $scope.form.activeclass = '';
        }

    };

    $scope.createRecord = function () {

        console.log($scope.form.user);

        var data = {
            "table": "Customer",
            "values": $scope.form.user
        };

        DS.createRecord(data).then(updateSuccess, updateFailure)
            .finally(function () {
                console.log("finally");
            });

    };

    $scope.createColor = function (newColor) {
        var data = {
            "table": "products_colors",
            "values": newColor
        };

        return DS.createRecord(data)
            .finally(function () {
                console.log("color created");
            });
    };

    $scope.createSize = function (newSize) {
        var data = {
            "table": "products_sizes",
            "values": newSize
        };

        return DS.createRecord(data)
            .finally(function () {
                console.log("size created");
            });
    };

    $scope.createSpecies = function (newSpecies) {
        var data = {
            "table": "products_species",
            "values": newSpecies
        };

        return DS.createRecord(data)
            .finally(function () {
                console.log("species created");
            });
    };


    $scope.loadDataSet = function (searchTerm) {

        var termLength = searchTerm.length;

        if (termLength == 0) {

            $scope.scrollMode = true;
            $scope.offset = 0;
            $scope.currentData = [];
            $scope.loadMore();

        }

        if (termLength >= 4) {

            $scope.scrollMode = false;

            if (stringIsNumber(searchTerm)) {

                DS.findProductsBySKU(searchTerm).then(processProducts);

            } else {
                let substring = "\'" + searchTerm + "\'";

                DS.getProductsBySearch(substring).then(processProducts);
            }


        } else {

            $scope.products = [];

        }

    };

    function stringIsNumber(s) {
        var x = +s; // made cast obvious for demonstration
        return x.toString() === s;
    }

	// redundant?
    $scope.onConsumerTypeSelected = function (consumerType) {

        $scope.form.user.cuCustomerTypeID = consumerType.ctCustomerTypeID;

    };
    
    // Template function to query the the Pricing object
    $scope.getPricing = function(index, field) {
		if ($scope.form.master.pricing != null) {
			return $scope.form.master.pricing[index+" "+field];
		} else {
			return "";
		}
	    
    };
    
    // Template funciton to query the Locations object
    $scope.getLocation = function(index, field) {
		if ($scope.form.master.locations != null) {
			return $scope.form.master.locations[index+" "+field];
		} else {
			return "";
		}
	    
    };
    
    // Template function to update selected brand from select
    $scope.updateSelectedBrand = function(brand) {
	    $scope.form.user.brand_id = brand.id;
    }

    // Template function to update selected size from select
    $scope.updateSelectedSize = function(size) {
	    $scope.form.user.size_id = size.id;
    }

    // Template function to update selected color from select
    $scope.updateSelectedColor = function(color) {
	    $scope.form.user.color_id = color.id;
    }
    
    // Template function to add selcted category to the product scope
    $scope.addCategory = function(cat) {
        //console.log(cat);
        cat = parseInt(cat);
    	$scope.form.user.added_category = ( $scope.form.user.added_category instanceof Array ) ? $scope.form.user.added_category : [];
        if ($scope.form.user.added_category.filter(val => val == cat).length <= 0) {
            $scope.form.user.added_category.push(cat);
        }
        console.log($scope.form.user.added_category);
    }

    // Template function to add selcted related sku to the product scope
    $scope.addRelated = function(cat) {
        //console.log(cat);
        cat = parseInt(cat);
    	$scope.form.user.related_skus = ( $scope.form.user.related_skus instanceof Array ) ? $scope.form.user.related_skus : [];
        if ($scope.form.user.related_skus.filter(val => val == cat).length <= 0) {
            $scope.form.user.related_skus.push(cat);
        }
        console.log($scope.form.user.related_skus);
    }

    // Template function to add selcted species to the product scope
    $scope.addSpecies = function(spec) {
        $scope.form.user.species_id = ( $scope.form.user.species_id instanceof Array ) ? $scope.form.user.species_id : [];
	    $scope.form.user.species_id.push(spec.id);
    }
    
    // Template function to remove selected category from the product
    $scope.removeCategory = function(cat) {
    	console.log(cat);
        console.log($scope.form.user.added_category.indexOf(cat));
	    $scope.form.user.added_category = $scope.form.user.added_category.filter(val => val !== cat);
    }

    // Template function to remove selected related sku from the product
    $scope.removeRelated = function(cat) {
        if ($scope.form.edit) {
            console.log(cat);
            console.log($scope.form.user.related_skus.indexOf(cat));
            $scope.form.user.related_skus = $scope.form.user.related_skus.filter(val => val !== cat);
        }
    }

    // Template function to remove a highlight from the product
    $scope.removeHighlight = function(highlight) {
        if ($scope.form.edit) {
            $scope.form.user['feature_'+highlight] = "";
        }
    }

    // Template function to remove a species from the product
    $scope.removeSpecies = function(species) {
        if ($scope.form.edit) {
            $scope.form.user.species_id = $scope.form.user.species_id.filter(val => val !== species);
        }
    }
    
    // Template function to load correct data in and change view
    $scope.changeScreen = function(index, screen) {
    	// load the data first
    	if (screen == "media") {
	    	DS.getProductImagesBySKU($scope.form.user['item_number']).then(function(response) {
			   $scope.form.master.images = response.data;
			   $scope.form.user.images = angular.copy($scope.form.master.images);
			   $scope.view.record.images = response.data;
		    });/*
            DS.getWooProductsBySKU($scope.form.user['item_number']).then(function(response) {
                console.log('product_by_sku', response);
                $scope.form.user.wooProduct =response.data;
            })*/
    	}
    	else if (screen == "pricing" || screen == "inventory") {
	    	DS.getProductPricingBySKU($scope.form.user['item_number']).then(function(response) {
			   $scope.form.master.pricing = response.data[0];
			   $scope.form.user.pricing = angular.copy($scope.form.master.pricing);
			   $scope.view.record.pricing = response.data[0];
		    });
		    
    	}
    	else if (screen == "location") {
	    	DS.getProductLocationsBySKU($scope.form.user['item_number']).then(function(response) {
			   $scope.form.master.locations = response.data[0];
			   $scope.form.user.locations = angular.copy($scope.form.master.locations);
			   $scope.view.record.locations = response.data[0];
		    });
		    
    	}
    	else if (screen == "lookup") {
	    	DS.getProductUPCBySKU($scope.form.user['item_number']).then(function(response) {
			   $scope.form.master.upc = response.data;
			   $scope.form.user.upc = angular.copy($scope.form.master.upc);
			   $scope.view.record.upc = response.data;
		    });
		    
    	}
    	else if (screen == "master") {
	    	DS.getProductMasterBySKU($scope.form.user['item_number']).then(function(response) {
			   $scope.form.master.master = response.data[0];
			   $scope.form.user.master = angular.copy($scope.form.master.master);
			   $scope.view.record.master = response.data[0];
		    });
		    
    	}
    	
    	
		// then change the screen
    	$scope.nav.selectedIndex = index;
	    $scope.view.screen = screen;
    }



    /*
     *
     * WOOCOMMERCE FUNCTIONS
     *
     */
    $scope.publishProduct2 = function() {
        WS.processSingle($scope.form.user);
    }

}]);


