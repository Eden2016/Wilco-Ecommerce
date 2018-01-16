'use strict';

app.controller('ProductCategoriesCtrl', ['$scope', '$rootScope', 'DataService.api', 'MessagingService', 'authService', '$q', function ($scope, $rootScope, DS, MS, authService, $q) {
    var vm = this;
    vm.auth = authService;

    $scope.offset = 0;
    var offset_increment = 50;

    var utilityOffset = 0;
    var utilityOffsetIncrement = 100;

    var page = 1;

    $scope.scrollMode = true;

    $scope.currentData = [];

    $scope.currentProductCategoriesData = [];

    $scope.currentExisitingProductCategoriesData = [];

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
        existingRecord: false
    };

    $scope.data = [];
    $scope.productCategories = [];
    $scope.existingProductIDs = [];
    $scope.letters = [];
    $scope.form = {
        edit: false,
        master: {},
        user: {},
        activeclass: ''
    };

    $scope.parent_class = "N/A";

    //getExistingproductCategories();
    getProductCategories();

    $scope.productCategoriesGrid = {
        infiniteScrollDown: true,
        enableRowSelection: true,
        enableFullRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        columnDefs: [
            { field: "name", displayName: "Category Name"},
            { field: "ic1", displayName: "ic1", width: 25, headerCellTemplate: "<span class='wicon-shop'></span>", cellTemplate: "<span class='wicon-shop' ng-if='row.entity.ic1 == true'></span>" },
            { field: "ic2", displayName: "ic2", width: 25, headerCellTemplate: "<span class='wicon-tag'></span>", cellTemplate: "<span class='wicon-tag' ng-if='row.entity.ic2 == true'></span>" },
            { field: "ic3", type: 'boolean', displayName: "ic3", width: 25, headerCellTemplate: "<span class='wicon-edit'></span>", cellTemplate: "<span class='wicon-edit' ng-if='row.entity.ic3 == true'></span>" },
        ],
        rowHeight: 49,
        enableSorting: false,
        enableColumnMenus: false,
        data: 'productCategories',
        onRegisterApi: function(gridApi){
            $scope.gridApi = gridApi;
            gridApi.selection.on.rowSelectionChanged($scope, function(row) {
                $scope.loadClickedRecord(row);
            });
        }
    };

    function getProductCategories(callback) {

        DS.getProductCategories().then(processProductCategories);
        if (callback) {
            callback();
        }
    }

    function getExistingProductCategories(callback) {
        DS.getExistingProductCategories().then(processExistingProductCategories);
    }

    function getUtilityById(id) {
        DS.getUtility(id).then(assignCurrentUtility);
    }


    function processProductCategories(response) {

        let tmp = [];
        /*response.data.sort(function (a, b) {
         let textA = a.utName.toUpperCase();
         let textB = b.utName.toUpperCase();
         return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
         });*/

        $scope.productCategories = [];
        $scope.productCategories = response.data;

        $scope.productCategories.forEach(function(cat) {
            cat.image = JSON.parse(cat.image);
        });

        console.log($scope.productCategories);
        //getExistingProductCategories();


    }

    function processExistingProductCategories(response) {


        var temp = $scope.productCategories;

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

    $scope.loadMoreProductCategories = function () {
        page = page + 1;
        var results = getProductCategories(page);

        if (results.length !== 0) {
            $scope.gridApi.infiniteScroll.saveScrollPercentage();
            $scope.productCategories = $scope.productCategories.concat(results);
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

            // to relate a name to the parent_id
            if (data.entity) {
                for (var i = 0; i < $scope.productCategories.length; i++) {
                    //console.log($scope.productCategories[i].id);
                    if (data.entity.parent_id == $scope.productCategories[i].id) {
                        $scope.form.user.parent_class = $scope.productCategories[i].name;
                    }
                }
            }


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

            getProductCategories();

            return false;
        }

        $scope.highlightCorrectUtility(data);

        $scope.utilityFilter = data.record['utUtilityID'];

        $scope.currentData = [];

        $scope.offset = 0;

        getProductCategories();

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


    $scope.updateSingleProductCategory = function () {
        // creating new Category
        if ($scope.form.user.parent_class) {
            delete $scope.form.user.parent_class;
        }
        if ($scope.form.user.id == null) {
            $scope.createRecord();
        } else { // updating
            var imageDeferred = $q.defer();
            
            var uploadedImage = jQuery("#categoryimage")[0].files[0];

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
                $scope.publishProductCategory().then(function(resp) {
                    $scope.form.user.image = JSON.stringify($scope.form.user.image);
                    var data = {
                        values: $scope.form.user,
                        table: 'products_categories'
                    };
                    console.log('xxx',$scope.form.user.parent_id);
                    DS.updateProductCategory($scope.form.user)
                        .then(updateSuccess, updateFailure)
                        .finally(function () {
                            console.log("finally");
                        });
                });
            });

        }

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
            getProductCategories();
            $scope.loadSingleView({entity: {}});
        }
        else if (response.config.url.indexOf('new') >= 0) {
            message.text = 'Record created!';
            getProductCategories();
            $scope.loadSingleView({entity: response.data.values});
        }
        else if (response.config.url.indexOf('update') >= 0) {
            message.text = 'Record updated!';
            getProductCategories();
            console.log('RES',response.data.values);
            $scope.loadSingleView({entity: response.data.values});
        }
        else {
            message.text = 'Success!';
            getProductCategories();
            $scope.loadSingleView({entity: {}});
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
        getProductCategories();

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

    $scope.deleteSingleProductCategory = function () {
        DS.deleteProductCategory($scope.view.record)
            .then(updateSuccess, updateFailure)
            .finally(function () {
                console.log("finally");
            });

    };


    //When Utility is selected from dropdown in form for Consumer
    $scope.onUtilitySelected = function (utility) {

        $scope.form.user.cuUtilityID = utility.utUtilityID;

        getProductCategories();
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
            "table": "products_categories",
            "values": $scope.form.user
        };

        DS.createRecord(data).then(updateSuccess, updateFailure)
            .finally(function () {
            });

        // then, create record on woocommerce side
        DS.createCategory(data);
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
            let subString = String(searchTerm).toUpperCase();

            if (stringIsNumber(searchTerm)) {
                DS.findProductsBySKU(searchTerm).then(processProductCategories);
            } else {

                let substring = "\'" + searchTerm + "\'";

                DS.getProductCategoriesBySearch(substring).then(processProductCategories);

            }
        } else {

            $scope.productCategories = [];

        }

    };

    function stringIsNumber(s) {
        var x = +s; // made cast obvious for demonstration
        return x.toString() === s;
    }

    $scope.publishProductCategory = function () {
        var category = $scope.form.user;

        var deferred = $q.defer();

        // Woo Data
        var wooData = {
            name: category.name,
            description: category.description
        };

        var theImage = $scope.form.user.image;
        if (theImage !== null) {
            wooData.image = {id:theImage.attachmentID};
        }

        // User message
        var message = {
            id: Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36),
            text: 'P',
            type: 'success',
            platform: 'server'
        };

        // update or create
        if (typeof category.woo_id !== 'undefined' && category.woo_id !== null) {
            // update only
            message.text = "Updating the WooCommerce category.";
            DS.wooUpdateProductCategory(category.woo_id, wooData).then(function(response) {
                response = JSON.parse(response.data);
                console.log(response);
                deferred.resolve();
                //message.text = "Product Category already exists (ID: " + response.id + "), updating instead.";
            });
        } else {
            // create, then update mware record
            message.text = "Creating a new WooCommerce category.";
            DS.wooCreateProductCategory(wooData).then(function(response) {
                response = JSON.parse(response.data);
                console.log(response);

                // check the response
                if (typeof response.id !== 'undefined') {
                    // category was created
                    $scope.form.user.woo_id = response.id;
                    deferred.resolve();
                    
                    message.text = "Product Category was published to WooCommerce. ID: "+response.id;
                } 
            });
        }

        MS.addMessage(message);

        return deferred.promise;

    };

    $scope.onConsumerTypeSelected = function (consumerType) {

        $scope.form.user.cuCustomerTypeID = consumerType.ctCustomerTypeID;

    };


}]);