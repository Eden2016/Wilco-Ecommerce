/**
 * Created by Corey on 8/8/17.
 */
'use strict';

app.controller('SettingsCtrl', ['$scope', '$rootScope', 'DataService.api', 'MessagingService', 'authService',  function ($scope, $rootScope, DS, MS, authService) {
    var vm = this;
    vm.auth = authService;

    $scope.offset = 0;
    var offset_increment = 50;


    $scope.dayDateFormat = 'yyyy-MM-dd';

    $scope.timeDateFormat = 'MMM d, y h:mm:ss a';

    $scope.selectedConsumerTypeID = -1;

    $scope.selectedProgramID = -1;

    $scope.selectedUtility = null;

    $scope.utilityFilter = -1;

    $scope.view = {
        record: {},
        highlightedItem: {},
        message: {},
        existingRecord: false
    };

    $scope.letters = [];
    $scope.form = {
        edit: false,
        master: {},
        user: {},
        activeclass: ''
    };

    $scope.currentSetting = "None";

    $scope.consumers = [];

    $scope.programs = [];

    $scope.currentData = [];



    getConsumerTypes();
    getPrograms();

    $scope.changeSettingsType = function(type) {

        if($scope.currentSetting == type) {
            $scope.currentSetting = -1;

            $scope.selectedFilter = -1;

        } else {
            $scope.currentSetting = type;

            $scope.selectedFilter = type;
        }

    };

    function getConsumerTypes() {
        DS.getConsumerTypes().then(processConsumerTypes);

    }

    function getPrograms() {
        DS.getPrograms().then(processPrograms);

    }

    function processConsumerTypes(response) {

        let tmp = [];

        response.data = response.data.filter(function (item) {
            return item.ctCustomerType !== null;
        });


        response.data.sort(function (a, b) {

            let textA = a.ctCustomerType.toUpperCase() ;

            let textB = b.ctCustomerType.toUpperCase();

            if (textA < textB) {
                return -1;
            }
            if (textA > textB) {
                return 1;
            }
            // names must be equal
            return 0;
        });


        for (let i = 0; i < response.data.length; i++) {

            var letter = response.data[i].ctCustomerType.charAt(0);

            if (tmp[letter] == undefined) {
                tmp[letter] = [];
            }
            tmp[letter].push(response.data[i]);
        }

        $scope.letters = Object.keys(tmp);

        let flattened = [];
        for (var property in tmp) {
            if (tmp.hasOwnProperty(property)) {
                //first push the letter
                flattened.push({ctCustomerType: property, type: 'letter'});
                //then push the items in the letter
                for (let i = 0; i < tmp[property].length; i++) {
                    tmp[property][i].type = 'record';
                    flattened.push(tmp[property][i]);
                }
            }
        }

        $scope.consumerTypes = [];
        $scope.consumerTypes = flattened;



    };

    function processPrograms(response) {
        console.log(response);
        let tmp = [];

        response.data = response.data.filter(function (item) {
            return item.prName !== null;
        });


        response.data.sort(function (a, b) {

            let textA = a.prName.toUpperCase() ;

            let textB = b.prName.toUpperCase();

            if (textA < textB) {
                return -1;
            }
            if (textA > textB) {
                return 1;
            }
            // names must be equal
            return 0;
        });


        for (let i = 0; i < response.data.length; i++) {

            var letter = response.data[i].prName.charAt(0);

            if (tmp[letter] == undefined) {
                tmp[letter] = [];
            }
            tmp[letter].push(response.data[i]);
        }

        $scope.letters = Object.keys(tmp);

        let flattened = [];
        for (var property in tmp) {
            if (tmp.hasOwnProperty(property)) {
                //first push the letter
                flattened.push({prName: property, type: 'letter'});
                //then push the items in the letter
                for (let i = 0; i < tmp[property].length; i++) {
                    tmp[property][i].type = 'record';
                    flattened.push(tmp[property][i]);
                }
            }
        }

        $scope.programs = [];
        $scope.programs = flattened;



    };


    $scope.highlightCorrectRecord = function (data) {


        if ($scope.currentSetting == "ConsumerType") {

            $scope.selectedProgramID = -1;

            $scope.selectedConsumerTypeID = data.record['ctCustomerTypeID'];

        } else {

            $scope.selectedConsumerTypeID = -1;

            $scope.selectedProgramID = data.record['prProgramID'];

        }

    };

    $scope.loadClickedRecord = function (data) {

        if ($scope.form.edit || data.record['type'] === "letter") {
            //if we are in edit mode, don't allow changing of records
            return false;
        }

        $scope.highlightCorrectRecord(data);
        $scope.loadSingleView(data);
    };

    $scope.loadSingleView = function (data) {
        if (data && data.record) {
            $scope.form.master = data.record; //for reset of form (cancel)
            angular.copy($scope.form.master, $scope.form.user);
            $scope.view.record = data.record;
        }
        else {
            console.log("Data for single view not supplied.");
        }
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


    $scope.updateSingleConsumerType = function () {

        DS.updateConsumerType($scope.form.user)
            .then(updateSuccess, updateFailure)
            .finally(function () {
                console.log("finally");
            });

    };

    $scope.updateSingleProgram = function () {

        DS.updateProgram($scope.form.user)
            .then(updateSuccess, updateFailure)
            .finally(function () {
                console.log("finally");
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
            if($scope.currentSetting == "ConsumerType") {
                getConsumerTypes();
            } else if($scope.currentSetting == "Program") {
                getPrograms();
            }
            $scope.loadSingleView({record: response.data.values});
        }
        else if (response.config.url.indexOf('update') >= 0) {
            message.text = 'Record updated!';
            if($scope.currentSetting == "ConsumerType") {
                getConsumerTypes();
            } else if($scope.currentSetting == "Program") {
                getPrograms();
            }
            $scope.loadSingleView({record: response.data.values});
        }
        else {
            message.text = 'Success!';
            if($scope.currentSetting == "ConsumerType") {
                getConsumerTypes();
            } else if($scope.currentSetting == "Program") {
                getPrograms();
            }
            $scope.loadSingleView({record: {}});
        }

        $scope.editModeToggle();
        MS.addMessage(message);
    };

    function updateFailure(response) {

        var message = {
            id: Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36),
            text: 'Unable to complete operation.',
            type: 'warning',
            platform: 'server'
        };

        MS.addMessage(message);
        $scope.editModeToggle();
        if($scope.currentSetting == "ConsumerType") {
            getConsumerTypes();
        } else if($scope.currentSetting == "Program") {
            getPrograms();
        }

    };


    $scope.createRecord = function () {

        console.log($scope.form.user);


        if($scope.currentSetting=="ConsumerType") {
            var data = {
                "table" : "CustomerType",
                "values" : $scope.form.user
            };
        } else if ($scope.currentSetting=="Program") {
            var data = {
                "table" : "Program",
                "values" : $scope.form.user
            };
        }


        DS.createRecord(data).then(updateSuccess, updateFailure)
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


    $scope.deleteSingleConsumerType = function () {
        DS.deleteConsumerType($scope.view.record)
            .then(updateSuccess, updateFailure)
            .finally(function () {
                console.log("finally");
            });
    };


    $scope.deleteSingleProgram = function () {
        DS.deleteProgram($scope.view.record)
            .then(updateSuccess, updateFailure)
            .finally(function () {
                console.log("finally");
            });
    };

    $scope.loadCTDataSet = function(searchTerm) {
        var termLength = searchTerm.length;

        if (termLength == 0) {

            $scope.scrollMode = true;
            $scope.offset = 0;

            getConsumerTypes();

        }

        if ( termLength >= 3) {

            $scope.scrollMode = false;
            let subString = String(searchTerm).toUpperCase();

            let tempData = [];

            angular.forEach($scope.consumerTypes, function (value, key) {

                if (value.ctCustomerType.length >= termLength) {
                    if (value.ctCustomerType.toUpperCase().indexOf(subString) !== -1) {
                        tempData.push($scope.consumerTypes[key]);
                    }
                }

            });

            $scope.consumerTypes = tempData;

        }
    }

    $scope.loadPDataSet = function(searchTerm) {
        var termLength = searchTerm.length;

        if (termLength == 0) {

            $scope.scrollMode = true;
            $scope.offset = 0;

            getPrograms();

        }

        if ( termLength >= 3) {

            $scope.scrollMode = false;
            let subString = String(searchTerm).toUpperCase();

            let tempData = [];

            angular.forEach($scope.programs, function (value, key) {

                if (value.prName.length >= termLength) {
                    if (value.prName.toUpperCase().indexOf(subString) !== -1) {
                        tempData.push($scope.programs[key]);
                    }
                }

            });

            $scope.programs = tempData;

        }

    }















}]);