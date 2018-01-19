'use strict';

app.controller('ProductBrandsCtrl', ['$scope', '$rootScope', 'DataService.api', 'MessagingService', 'authService', 'uiGridConstants', '$q', function ($scope, $rootScope, DS, MS, authService, uiGridConstants, $q) {
    var vm = this;
    vm.auth = authService;

    $scope.offset = 0;
    var offset_increment = 50;

    var utilityOffset = 0;
    var utilityOffsetIncrement = 100;

    var page = 1;

    $scope.scrollMode = true;

    $scope.removeImage = false;

    $scope.currentData = [];

    $scope.currentProductBrandsData = [];

    $scope.currentExisitingProductBrandsData = [];

    $scope.selectedFilter = "None";

    $scope.dayDateFormat = 'yyyy-MM-dd';

    $scope.timeDateFormat = 'MMM d, y h:mm:ss a';

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
        existingRecord: false
    };

    $scope.data = [];
    $scope.productBrands = [];
    $scope.existingProductIDs = [];
    $scope.letters = [];
    $scope.form = {
        edit: false,
        master: {},
        user: {},
        activeclass: ''
    };

    //getExistingproductBrands();
    getProductBrands();

    $scope.productBrandsGrid = {
        infiniteScrollDown: true,
        enableRowSelection: true,
        enableFullRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        columnDefs: [
            {
                field: "brand_name", displayName: "Brand Name",
                sort: { direction: uiGridConstants.ASC, priority: 1 }
            },
            { field: "ic1", displayName: "ic1", width: 25, headerCellTemplate: "<span class='wicon-shop'></span>", cellTemplate: "<span class='wicon-shop' ng-if='row.entity.ic1 == true'></span>" },
            { field: "ic2", displayName: "ic2", width: 25, headerCellTemplate: "<span class='wicon-tag'></span>", cellTemplate: "<span class='wicon-tag' ng-if='row.entity.ic2 == true'></span>" },
            { field: "ic3", type: 'boolean', displayName: "ic3", width: 25, headerCellTemplate: "<span class='wicon-edit'></span>", cellTemplate: "<span class='wicon-edit' ng-if='row.entity.ic3 == true'></span>" },
        ],
        rowHeight: 49,
        enableSorting: true,
        enableColumnMenus: false,
        data: 'productBrands',
        onRegisterApi: function(gridApi){
            $scope.gridApi = gridApi;
            gridApi.selection.on.rowSelectionChanged($scope, function(row) {
                $scope.loadClickedRecord(row);
            });
        }
    };

    function getProductBrands(callback) {

        DS.getProductBrands().then(processProductBrands);
        if (callback) {
            callback();
        }

    }

    function getExistingProductBrands(callback) {
        DS.getExistingProductBrands().then(processExistingProductBrands);
    }

    function getUtilityById(id) {
        DS.getUtility(id).then(assignCurrentUtility);
    }


    function processProductBrands(response) {

        let tmp = [];
        /*response.data.sort(function (a, b) {
         let textA = a.utName.toUpperCase();
         let textB = b.utName.toUpperCase();
         return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
         });*/

        $scope.productBrands = [];
        $scope.productBrands = response.data;


        $scope.productBrands.forEach(function(brand) {
            if (brand.image)
                brand.image = JSON.parse(brand.image);
        });

        console.log($scope.productBrands);
        //getExistingProductBrands();


    }

    function processExistingProductBrands(response) {


        var temp = $scope.productBrands;

        angular.forEach(response.data, function (value, key) {
            $scope.existingProductIDs.push(value["Item Number"]);
        });


        temp = temp.filter(function (item) {

            return $scope.existingProductIDs.indexOf(item["Item Number"]) !== -1;

        });

        $scope.currentExisitingProductData = temp;


    }

    function processConsumerTypes(response) {

        let tmp = [];
        response.data.sort(function (a, b) {
            let textA = a.ctCustomerType.toUpperCase();
            let textB = b.ctCustomerType.toUpperCase();
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });

        $scope.consumerTypes = [];
        $scope.consumerTypes = response.data;
    }

    function assignCurrentUtility(response) {

        console.log(response);

        $scope.selectedUtility = response.data[0];

        var count = 0;

        angular.forEach($scope.utilities, function (value, key) {
            if (value.utUtilityID == $scope.selectedUtility.utUtilityID) {
                $scope.utilitySelect = $scope.utilities[count];
            }
            count++;
        });


    }

    function assignCurrentConsumerType(response) {
        $scope.selectedConsumerType = response.data[0];

        if ($scope.selectedConsumerType == null) {
            return -1;
        }


        var count = 0;

        angular.forEach($scope.consumerTypes, function (value, key) {

            if (value.ctCustomerTypeID == null) {
                console.log("Here")
            }

            if (value.ctCustomerTypeID == $scope.selectedConsumerType.ctCustomerTypeID) {
                $scope.consumerTypeSelect = $scope.consumerTypes[count];
            }
            count++;

        });
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

    $scope.loadMoreProductBrands = function () {
        page = page + 1;
        var results = getProductBrands(page);

        if (results.length !== 0) {
            $scope.gridApi.infiniteScroll.saveScrollPercentage();
            $scope.productBrands = $scope.productBrands.concat(results);
            return $scope.gridApi.infiniteScroll.dataLoaded(false, true);
        }
    };

    $scope.loadClickedRecord = function (data) {

        if ($scope.form.edit) {
            //if we are in edit mode, don't allow changing of records
            return false;
        }
        //console.log(data);
        $scope.loadSingleView(data);
    };

    $scope.loadSingleView = function (data) {
        if (data) {
            $scope.form.master = data.entity;
            angular.copy($scope.form.master, $scope.form.user);
            $scope.view.record = data.entity;
            console.log($scope.form.user);
        }
        else {
            console.log("Data for single view not supplied.");
        }
    };

    $scope.viewLoaded = function () {
        return $scope.form.user.id != null;
    };


    $scope.filterByUtility = function (data) {

        if ($scope.form.edit) {
            //if we are in edit mode, don't allow changing of records
            return false;
        }

        if (data.record['utUtilityID'] == $scope.utilityFilter) {

            $scope.utilityFilter = -1;

            $scope.selectedUtilityID = -1;

            $scope.currentData = [];

            $scope.offset = 0;

            getProductBrands();

            return false;
        }

        $scope.highlightCorrectUtility(data);

        $scope.utilityFilter = data.record['utUtilityID'];

        $scope.currentData = [];

        $scope.offset = 0;

        getProductBrands();

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
        }
        else {
            $scope.form.activeclass = '';
        }
    };


    $scope.updateSingleProductBrand = function () {
        // creating new brand
        if ($scope.form.user.id == null) {
            $scope.createRecord();
        } else { // updating
            var imageDeferred = $q.defer();

            var uploadedImage = jQuery("#brandimage")[0].files[0];

            if (typeof uploadedImage !== 'undefined') {
                var r = new FormData();
                r.append('file',uploadedImage);
                r.append( 'title', "hello world" );
    
                DS.wooUploadImage(r).then(function(response) {
                    if (typeof response.data.id != 'undefined') {
                        // we got an attachment back
                        $scope.form.user.image = {
                            attachmentID: response.data.id,
                            imageSource: response.data.source_url
                        };
                    } else {
                        console.log("Error");
                        console.log(response);
                    }

                    imageDeferred.resolve();
                });
            } else {
                imageDeferred.resolve();
            }

            $q.all(imageDeferred).then(function() {
                $scope.publishProductBrand();
                $scope.form.user.image = JSON.stringify($scope.form.user.image);
                DS.updateProductBrand($scope.form.user)
                    .then(updateSuccess, updateFailure)
                    .finally(function () {
                        console.log("finally");
                    });
            });
            

            
            //$scope.publishProductBrand();
        }

    };

    $scope.removeProductBrandImage = function () {
        var message = {
            id: Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36),
            text: 'P',
            type: 'success',
            platform: 'server'
        };

        if ($scope.form.user && $scope.form.user.woo_id) {
            $scope.form.user.image = null;
            // prepare our data to be pushed to WC
            var wooData = {
                name: $scope.form.user.brand_name,
                description: $scope.form.user.description,
                image: null
            };

            
            DS.updateProductBrand($scope.form.user)
                .then(updateSuccess, updateFailure)
                .finally(function () {
                    console.log("finally");
                });

            DS.wooUpdateProductBrand($scope.form.user.woo_id, wooData).then(function(response) {
                response = JSON.parse(response.data);
                console.log("update response:");
                console.log(response);

                message.text = "Image removed succesfuly.";
                    
                MS.addMessage(message);
                //message.text = "Product Brand already exists (ID: " + response.id + "), updating instead.";
            });
        } else {
            message.text = "This product isnt conected to WooCommerce.";
                    
            MS.addMessage(message);
        }
    };

    $scope.showRemoveImage = function () {
        $scope.removeImage = true;
    };

    $scope.leaveImage = function () {
        $scope.removeImage = !$scope.removeImage;
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
            getProductBrands();
            $scope.loadSingleView({record: {}});
        }
        else if (response.config.url.indexOf('new') >= 0) {
            message.text = 'Record created!';
            getProductBrands();
            $scope.loadSingleView({record: response.data.values});
        }
        else if (response.config.url.indexOf('update') >= 0) {
            message.text = 'Record updated!';
            getProductBrands();
            console.log('RES',response.data.values);
            $scope.loadSingleView({record: response.data.values});
        }
        else {
            message.text = 'Success!';
            getProductBrands();
            $scope.loadSingleView({record: {}});
        }

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
        getProductBrands();

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

    $scope.deleteSingleProductBrand = function () {
        DS.deleteProductBrand($scope.view.record)
            .then(updateSuccess, updateFailure)
            .finally(function () {
                console.log("finally");
            });

    };


    //When Utility is selected from dropdown in form for Consumer
    $scope.onUtilitySelected = function (utility) {

        $scope.form.user.cuUtilityID = utility.utUtilityID;

        getProductBrands();
    };

    $scope.highlightCorrectUtility = function (data) {

        $scope.selectedUtilityID = data.record['utUtilityID'];

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
            "table": "products_brands",
            "values": $scope.form.user
        };

        DS.createRecord(data).then(updateSuccess, updateFailure)
            .finally(function () {
                console.log("finally");
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
            console.log(termLength);
            let subString = String(searchTerm).toUpperCase();

            console.log("result of");
            DS.findProductBrandsBySearchTerms(searchTerm).then(processProductBrands);
            console.log("data set");
        }

    }

    $scope.publishProductBrand = function () {
        var brand = $scope.form.user;

        // prepare our data to be pushed to WC
        var wooData = {
            name: brand.brand_name,
            description: brand.description,
            // image:  {
            //     src: "https://imagecatalog.pics/absorbine.svg"
            // }
            //meta_data: wooMeta,
            //attributes: []
        };

        var theImage = $scope.form.user.image;
        if (theImage !== null) {
            wooData.image = {id:theImage.attachmentID};
        }

        console.log('form data:', brand);
        console.log('woo data:', wooData);

        DS.wooCreateProductBrand(wooData).then(function(response) {
            response = JSON.parse(response.data);
            console.log(response);
            var message = {
                id: Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36),
                text: 'P',
                type: 'success',
                platform: 'server'
            };

            if (typeof response.id !== 'undefined') {
                brand.woo_id = response.id;
            } else if (typeof response.data.resource_id !== 'undefined') {
                brand.woo_id = response.data.resource_id;
            }
            
            console.log("Updated "+brand.brand_name+" setting Woo ID to "+brand.woo_id);
            console.log(brand);
            // DS.updateRecord({
            //     table: 'products_brands',
            //     values: brand
            // }).then(function(response) {
            //     def.resolve();
            // });

            // check the response
            if (typeof response.id !== 'undefined') {
                // product was created
                // *** todo: set the flag

                message.text = "Product Brand was published to WooCommerce. ID: "+response.id;
            } else if (response.code === "term_exists") {
                // product probably exists already
                DS.wooUpdateProductBrand(response.data.resource_id, wooData).then(function(response) {
                    response = JSON.parse(response.data);
                    console.log("update response:");
                    console.log(response);
                    //message.text = "Product Brand already exists (ID: " + response.id + "), updating instead.";
                });
                message.text = "Product Brand already exists, updating instead.";
            } else {
                // Something unexpected happened
                message.text = "Something went wrong.";
                console.log("The following is debug information for your publish attempt...");
                console.log(response);
            }
            MS.addMessage(message);
        });
    };

    $scope.publishAllProductBrands = function () {
        var promises = [];
        $scope.productBrands.forEach(function(brand) {
            console.log("Working on: "+brand.brand_name);
            if (brand.woo_id == null) {

                var def = $q.defer();

                var wooData = {
                    name: brand.brand_name,
                    description: brand.description
                };
                DS.wooCreateProductBrand(wooData).then(function(response) {
                    response = JSON.parse(response.data);
                    // it got created
                    if (typeof response.id !== 'undefined') {
                        brand.woo_id = response.id;
                    } else if (typeof response.data.resource_id !== 'undefined') {
                        brand.woo_id = response.data.resource_id;
                    }
                    
                    console.log("Updated "+brand.brand_name+" setting Woo ID to "+brand.woo_id);
                    DS.updateRecord({
                        table: 'products_brands',
                        values: brand
                    }).then(function(response) {
                        def.resolve();
                    });
                }, function(err) {
                    console.log(err);
                });

                promises.push(def.promise);
            }
        });

    };

    $scope.onConsumerTypeSelected = function (consumerType) {

        $scope.form.user.cuCustomerTypeID = consumerType.ctCustomerTypeID;

    };


}]);