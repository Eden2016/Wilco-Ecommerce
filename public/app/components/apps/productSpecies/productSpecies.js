/**
 * Created by Corey on 8/8/17.
 */
'use strict';

app.controller('ProductSpeciesCtrl', ['$scope', '$rootScope', 'DataService.api', 'MessagingService', 'authService', function ($scope, $rootScope, DS, MS, authService) {
    var vm = this;
    vm.auth = authService;

    $scope.offset = 0;
    var offset_increment = 50;

    var utilityOffset = 0;
    var utilityOffsetIncrement = 100;

    var page = 1;

    $scope.scrollMode = true;

    $scope.currentData = [];

    $scope.currentProductSpeciesData = [];

    $scope.currentExisitingProductSpeciesData = [];

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
    $scope.productSpecies = [];
    $scope.existingProductIDs = [];
    $scope.letters = [];
    $scope.form = {
        edit: false,
        master: {},
        user: {},
        activeclass: ''
    };

    //getExistingproductSpecies();
    getProductSpecies();

    $scope.productSpeciesGrid = {
        infiniteScrollDown: true,
        enableRowSelection: true,
        enableFullRowSelection: true,
        enableRowHeaderSelection: false,
        multiSelect: false,
        columnDefs: [
            { field: "species_name", displayName: "Species Name"},
            { field: "ic1", displayName: "ic1", width: 25, headerCellTemplate: "<span class='wicon-shop'></span>", cellTemplate: "<span class='wicon-shop' ng-if='row.entity.ic1 == true'></span>" },
            { field: "ic2", displayName: "ic2", width: 25, headerCellTemplate: "<span class='wicon-tag'></span>", cellTemplate: "<span class='wicon-tag' ng-if='row.entity.ic2 == true'></span>" },
            { field: "ic3", type: 'boolean', displayName: "ic3", width: 25, headerCellTemplate: "<span class='wicon-edit'></span>", cellTemplate: "<span class='wicon-edit' ng-if='row.entity.ic3 == true'></span>" },
        ],
        rowHeight: 49,
        enableSorting: false,
        enableColumnMenus: false,
        data: 'productSpecies',
        onRegisterApi: function(gridApi){
            $scope.gridApi = gridApi;
            gridApi.selection.on.rowSelectionChanged($scope, function(row) {
                $scope.loadClickedRecord(row);
            });
        }
    };

    function getProductSpecies(callback) {
        DS.getProductSpecies().then(processProductSpecies);
        if (callback) {
            callback();
        }
    }

    function getExistingProductSpecies(callback) {
        DS.getExistingProductSpecies().then(processExistingProductSpecies);
    }

    function getUtilityById(id) {
        DS.getUtility(id).then(assignCurrentUtility);
    }


    function processProductSpecies(response) {

        let tmp = [];
        /*response.data.sort(function (a, b) {
         let textA = a.utName.toUpperCase();
         let textB = b.utName.toUpperCase();
         return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
         });*/

        $scope.productSpecies = [];
        $scope.productSpecies = response.data;

        console.log($scope.productSpecies);
        //getExistingProductSpecies();

    }

    function processExistingProductSpecies(response) {


        var temp = $scope.productSpecies;

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

    $scope.loadMoreProductSpecies = function () {
        page = page + 1;
        var results = getProductSpecies(page);

        if (results.length !== 0) {
            $scope.gridApi.infiniteScroll.saveScrollPercentage();
            $scope.productSpecies = $scope.productSpecies.concat(results);
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

            getProductSpecies();

            return false;
        }

        $scope.highlightCorrectUtility(data);

        $scope.utilityFilter = data.record['utUtilityID'];

        $scope.currentData = [];

        $scope.offset = 0;

        getProductSpecies();

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


    $scope.updateSingleProductSpecies = function () {
        // creating new Species
        if ($scope.form.user.id == null) {
            $scope.createRecord();
        } else { // updating
            DS.updateProductSpecies($scope.form.user)
                .then(updateSuccess, updateFailure)
                .finally(function () {
                    console.log("finally");
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
            getProductSpecies();
            $scope.loadSingleView({record: {}});
        }
        else if (response.config.url.indexOf('new') >= 0) {
            message.text = 'Record created!';
            getProductSpecies();
            $scope.loadSingleView({record: response.data.values});
        }
        else if (response.config.url.indexOf('update') >= 0) {
            message.text = 'Record updated!';
            getProductSpecies();
            console.log('RES',response.data.values);
            $scope.loadSingleView({record: response.data.values});
        }
        else {
            message.text = 'Success!';
            getProductSpecies();
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
        getProductSpecies();

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

    $scope.deleteSingleProductSpecies = function () {
        DS.deleteProductSpecies($scope.view.record)
            .then(updateSuccess, updateFailure)
            .finally(function () {
                console.log("finally");
            });
    };


    //When Utility is selected from dropdown in form for Consumer
    $scope.onUtilitySelected = function (utility) {

        $scope.form.user.cuUtilityID = utility.utUtilityID;

        getProductSpecies();
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
            "table": "products_species",
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

            DS.findProductsBySKU(searchTerm).then(processProductSpecies);

        }

    }


    $scope.onConsumerTypeSelected = function (consumerType) {

        $scope.form.user.cuCustomerTypeID = consumerType.ctCustomerTypeID;

    };


}]);