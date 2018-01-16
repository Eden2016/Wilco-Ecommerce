'use strict';

app.controller('StoresCtrl', ['$scope', '$rootScope', 'DataService.api', 'MessagingService', 'authService', 'uiGridConstants', '$q', function ($scope, $rootScope, DS, MS, authService, uiGridConstants, $q) {
    var vm = this;
    vm.auth = authService;

    $scope.offset = 0;
    var offset_increment = 50;

    var utilityOffset = 0;
    var utilityOffsetIncrement = 100;

    var page = 1;

    $scope.scrollMode = true;

    $scope.currentData = [];

    $scope.selectedFilter = "None";

    $scope.dayDateFormat = 'yyyy-MM-dd';

    $scope.timeDateFormat = 'MMM d, y h:mm:ss a';


    $scope.view = {
        record: {},
        highlightedItem: {},
        message: {},
        existingRecord: false
    };

    $scope.data = [];
    $scope.stores = [];
    $scope.existingProductIDs = [];
    $scope.letters = [];
    $scope.form = {
        edit: false,
        master: {},
        user: {},
        activeclass: ''
    };

    getStores();

    $scope.storesGrid = {
        infiniteScrollDown: true,
        enableRowSelection: true,
        enableFullRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        columnDefs: [
            { field: "store_name", displayName: "Store Name" },
            { field: "ic1", displayName: "ic1", width: 25, headerCellTemplate: "<span class='wicon-shop'></span>", cellTemplate: "<span class='wicon-shop' ng-if='row.entity.ic1 == true'></span>" },
            { field: "ic2", displayName: "ic2", width: 25, headerCellTemplate: "<span class='wicon-tag'></span>", cellTemplate: "<span class='wicon-tag' ng-if='row.entity.ic2 == true'></span>" },
            { field: "ic3", type: 'boolean', displayName: "ic3", width: 25, headerCellTemplate: "<span class='wicon-edit'></span>", cellTemplate: "<span class='wicon-edit' ng-if='row.entity.ic3 == true'></span>" },
        ],
        rowHeight: 49,
        enableSorting: true,
        enableColumnMenus: false,
        data: 'stores',
        onRegisterApi: function(gridApi){
            $scope.gridApi = gridApi;
            gridApi.selection.on.rowSelectionChanged($scope, function(row) {
                $scope.loadClickedRecord(row);
            });
        }
    };

    function getStores(callback) {

        DS.getTable('stores').then(processStores);
        if (callback) {
            callback();
        }
        getWooStores();
    }

    function getWooStores(callback) {
        DS.wooGetStores().then(function(response) {
            console.log('woo stores', response);
        });
        if (callback) {
            callback();
        }
    }


    function processStores(response) {
        $scope.stores = [];
        $scope.stores = response.data;
        $scope.stores.forEach(function(store) {
            store.image = JSON.parse(store.image);
        });
        console.log($scope.stores);

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

    $scope.loadMoreStores = function () {
        page = page + 1;
        var results = getStores(page);

        if (results.length !== 0) {
            $scope.gridApi.infiniteScroll.saveScrollPercentage();
            $scope.stores = $scope.stores.concat(results);
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

    $scope.createRecord = function () {
        console.log($scope.form.user);
        var data = {
            "table": "stores",
            "values": $scope.form.user
        };

        DS.createRecord(data).then(updateSuccess, updateFailure)
            .finally(function () {
                console.log("finally");
            });
    };

    $scope.updateSingleStore = function () {
        // creating new store
        if ($scope.form.user.id == null) {
            $scope.createRecord();
        } else { // updating
            var imageDeferred = $q.defer();

            var uploadedImage = jQuery("#storeImage")[0].files[0];

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
                $scope.publishStore().then(function(resp) {
                    $scope.form.user.image = JSON.stringify($scope.form.user.image);
                    // updating
                    var data = {
                        values: $scope.form.user,
                        table: "stores"
                    };
                    DS.updateRecord(data)
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
            getStores();
            $scope.loadSingleView({record: {}});
        }
        else if (response.config.url.indexOf('new') >= 0) {
            message.text = 'Record created!';
            getStores();
            $scope.loadSingleView({record: response.data.values});
        }
        else if (response.config.url.indexOf('update') >= 0) {
            message.text = 'Record updated!';
            getStores();
            console.log('RES',response.data.values);
            $scope.loadSingleView({record: response.data.values});
        }
        else {
            message.text = 'Success!';
            getStores();
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
        getStores();

    }

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

    $scope.deleteSingleStore = function () {
        DS.deleteStore($scope.view.record)
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
            DS.findProductsBySKU(searchTerm).then(processStores);
            console.log("data set");
        }

    }

    $scope.publishStore = function () {
        var store = $scope.form.user;
        var deferred = $q.defer();
        var wooData = {
            store_name: store.store_name,
            description: store.description,
            // image:  {
            //     src: "https://imagecatalog.pics/absorbine.svg"
            // }
            //meta_data: meta,
            //attributes: []
        };
        var theImage = $scope.form.user.image;
        if (theImage !== null) {
            wooData.image = {id:theImage.attachmentID};
        }
        // prepare our data to be pushed to WC
        var meta = {
            address: store.address,
            city: store.city,
            hours: store.hours,
            store_name: store.store_name,
            store_number: store.store_number
        };
        DS.processSingleStore(store).then(function(response) {
            response = response.data;
            if (response) {
                deferred.resolve();
                // record was already in wordpress, should hopefully be successful i think
            } else {
                // record is NOT in wordpress yet, need to create WP post
                DS.wooCreateStore(wooData).then(function(response) {
                    console.log('creating store..');
                    response = response.data;
                    store.woo_id = response.id;
                    console.log('successfully created store , postID: ', response.id);
                    console.log('trying to update new store post meta');
                    DS.processSingleStore(store).then(function(response) {
                        response = response.data;
                        console.log(response);
                        deferred.resolve();
                    });
                });
            }
        });
        return deferred.promise;

    };

    $scope.deleteStore = function () {
        var store_id = $scope.form.user.storeID;
        console.log('Deleting store.. : ' , store_id);
        DS.deleteStore(store_id);
    };

}]);