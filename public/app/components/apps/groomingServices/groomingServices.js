'use strict';

app.controller('groomingServicesCtrl', ['$scope', '$rootScope', 'DataService.api', 'MessagingService', 'authService', 'uiGridConstants', '$q', function ($scope, $rootScope, DS, MS, authService, uiGridConstants, $q) {
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
    $scope.groomingServices = [];
    $scope.letters = [];
    $scope.form = {
        edit: false,
        master: {},
        user: {},
        activeclass: ''
    };

    getGroomingServices();

    $scope.GroomingServicesGrid = {
        infiniteScrollDown: true,
        enableRowSelection: true,
        enableFullRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        columnDefs: [
            {
                field: "services_name", displayName: "Grooming Service Name",
                sort: { direction: uiGridConstants.ASC, priority: 1 }
            },
            /*{ field: "ic1", displayName: "ic1", width: 25, headerCellTemplate: "<span class='wicon-shop'></span>", cellTemplate: "<span class='wicon-shop' ng-if='row.entity.ic1 == true'></span>" },
            { field: "ic2", displayName: "ic2", width: 25, headerCellTemplate: "<span class='wicon-tag'></span>", cellTemplate: "<span class='wicon-tag' ng-if='row.entity.ic2 == true'></span>" },
            { field: "ic3", type: 'boolean', displayName: "ic3", width: 25, headerCellTemplate: "<span class='wicon-edit'></span>", cellTemplate: "<span class='wicon-edit' ng-if='row.entity.ic3 == true'></span>" },*/
        ],
        rowHeight: 49,
        enableSorting: true,
        enableColumnMenus: false,
        data: 'groomingServices',
        onRegisterApi: function(gridApi){
            $scope.gridApi = gridApi;
            gridApi.selection.on.rowSelectionChanged($scope, function(row) {
                $scope.loadClickedRecord(row);
            });
        }
    };

    function getGroomingServices(callback) {

        DS.getGroomingServices().then(processGroomingServices);
        if (callback) {
            callback();
        }

    }

    function processGroomingServices(response) {

        let tmp = [];
        /*response.data.sort(function (a, b) {
         let textA = a.utName.toUpperCase();
         let textB = b.utName.toUpperCase();
         return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
         });*/

        $scope.groomingServices = [];
        $scope.groomingServices = response.data;


        $scope.groomingServices.forEach(function(service) {
            if (service.image)
                service.image = JSON.parse(service.image);
        });

        console.log($scope.groomingServices);


    }

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

    $scope.updateSingleGroomingService = function () {
        // creating new brand
        if ($scope.form.user.id == null) {
            $scope.createRecord();
        } else { // updating
            var imageDeferred = $q.defer();

            var uploadedImage = jQuery("#image")[0].files[0];

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
                $scope.form.user.image = JSON.stringify($scope.form.user.image);
                DS.updateGroomingService($scope.form.user)
                    .then(updateSuccess, updateFailure)
                    .finally(function () {
                        console.log("finally");
                    });
            });
            

            
            //$scope.publishProductBrand();
        }

    };

    $scope.deleteSingleGroomingService = function () {
        DS.deleteGroomingService($scope.view.record)
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
            "table": "grooming_services",
            "values": $scope.form.user
        };
        console.log(data);

        var imageDeferred = $q.defer();

        var uploadedImage = jQuery("#image")[0].files[0];

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
            console.log($scope.form.user.image);
            data.values.image = JSON.stringify($scope.form.user.image);
            DS.createRecord(data).then(updateSuccess, updateFailure)
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
            getGroomingServices();
            $scope.loadSingleView({record: {}});
        }
        else if (response.config.url.indexOf('new') >= 0) {
            message.text = 'Record created!';
            getGroomingServices();
            $scope.loadSingleView({record: response.data.values});
        }
        else if (response.config.url.indexOf('update') >= 0) {
            message.text = 'Record updated!';
            getGroomingServices();
            console.log('RES',response.data.values);
            $scope.loadSingleView({record: response.data.values});
        }
        else {
            message.text = 'Success!';
            getGroomingServices();
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
        getGroomingServices();

    }

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
            DS.findGroomingServicesBySearch(searchTerm).then(processGroomingServices);
            console.log("data set");
        }
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

    $scope.showRemoveImage = function () {
        $scope.removeImage = true;
    };

    $scope.leaveImage = function () {
        $scope.removeImage = !$scope.removeImage;
    };

    $scope.removeGroomingServiceImage = function () {
        var message = {
            id: Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36),
            text: 'P',
            type: 'success',
            platform: 'server'
        };

        if ($scope.form.user) {
            $scope.form.user.image = null;
            // prepare our data to be pushed to WC
            var data = {
                name: $scope.form.user.services_name,
                description: $scope.form.user.description,
                image: null
            };

            
            DS.updateGroomingService($scope.form.user)
                .then(updateSuccess, updateFailure)
                .finally(function () {
                    console.log("finally");
                });

            message.text = "Image removed succesfuly.";
                
            MS.addMessage(message);
            //message.text = "Product Brand already exists (ID: " + response.id + "), updating instead.";
        
        } else {
            message.text = "Cant find service.";
                    
            MS.addMessage(message);
        }
    };

}]);