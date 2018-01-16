/**
 * Created by Corey on 8/8/17.
 */
'use strict';

app.controller('ApplicationsCtrl', ['$scope', '$rootScope', 'DataService.api', 'MessagingService', 'authService',  function ($scope, $rootScope, DS, MS, authService) {
    var vm = this;
    vm.auth = authService;

    $scope.offset = 0;
    var offset_increment = 50;

    var utilityOffset = 0;
    var utilityOffsetIncrement = 25;

    $scope.currentData = [];
    $scope.currentUtilityData = [];
    $scope.currentExisitingUtilityData = [];
    $scope.currentExisitingConsumerData = [];
    $scope.currentApplicationData = [];

    $scope.scrollMode = true;




    $scope.dayDateFormat = 'yyyy-MM-dd';
    $scope.timeDateFormat = 'MMM d, y h:mm:ss a';

    $scope.selectedApplicationID = -1;
    $scope.selectedUtilityID = -1;

    $scope.selectedUtility = null;
    $scope.selectedConsumerType = null;
    $scope.selectedConsumer = null;
    $scope.selectedMeasure = null;
    $scope.selectedProgram = null;

    $scope.utilityFilter = -1;

    $scope.utilitySelect = {};
    $scope.consumerSelect = {};
    $scope.consumerTypeSelect = {};
    $scope.programSelect = {};
    $scope.measureSelect = {};


    $scope.view = {
        record: {},
        highlightedItem: {},
        message: {},
        existingRecord: false
    };

    $scope.data = [];
    $scope.utilities = [];
    $scope.consumers = [];

    $scope.applications = [];

    $scope.existingUtilityIDs = [];
    $scope.existingConsumerIDs = [];
    $scope.letters = [];
    $scope.form = {
        edit: false,
        master: {},
        user: {},
        activeclass: ''
    };

    getApplicationsWithConsumers();
    getUtilities();
    getConsumers();
    getConsumerTypes();
    getMeasures();
    getPrograms();

    function getUtilities() {

        DS.getUtilities().then(processUtilities);
    }

    function getConsumers(callback) {

        DS.getConsumers().then(processConsumers);
    }

    function getConsumerTypes(callback) {

        DS.getConsumerTypes().then(processConsumerTypes);
    }

    function getMeasures(callback) {

        DS.getMeasures().then(processMeasures);
    }

    function getPrograms(callback) {

        DS.getPrograms().then(processPrograms);
    }

    function getExistingForeignKeys() {

        DS.getApplicationsForeignKeys().then(processForeignKeys);
    }

    function getApplicationsWithConsumers(callback) {

        DS.getApplicationsWithConsumers().then(processApplications);
    }

    function getUtilityById(id) {

        DS.getUtility(id).then(assignCurrentUtility);
    }

    function getConsumerTypeById(id) {

        DS.getConsumerType(id).then(assignCurrentConsumerType);
    }

    function getConsumerById(id) {

        DS.getConsumer(id).then(assignCurrentConsumer);
    }

    function getProgramById(id) {

        DS.getProgram(id).then(assignCurrentProgram);
    }

    function getMeasureById(id) {

        DS.getMeasure(id).then(assignCurrentMeasure);
    }



    function processApplications(response) {

        console.log(response);

        let tmp = [];

        response.data = response.data.filter(function (item) {
            return item.cuNameLast !== null;
        });


        if($scope.utilityFilter != -1) {
            response.data = response.data.filter(function (item) {
                return item.rbUtilityID === $scope.utilityFilter;
            });
        }


        response.data.sort(function (a, b) {

            let textA = a.cuNameLast.toUpperCase() ;

            let textB = b.cuNameLast.toUpperCase();

            if (textA < textB) {
                return -1;
            }
            if (textA > textB) {
                return 1;
            }
            // names must be equal
            return 0;
            // return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });


        for (let i = 0; i < response.data.length; i++) {


            response.data[i].rbEntryDate = new Date(response.data[i].rbEntryDate);

            response.data[i].rbCompleteDate = new Date(response.data[i].rbCompleteDate);

            response.data[i].rbDatePurchased = new Date(response.data[i].rbDatePurchased);


            var letter = response.data[i].cuNameLast.charAt(0);

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
                flattened.push({cuNameLast: property, type: 'letter'});
                //then push the items in the letter
                for (let i = 0; i < tmp[property].length; i++) {
                    tmp[property][i].type = 'record';
                    flattened.push(tmp[property][i]);
                }
            }
        }
        $scope.applications = [];
        $scope.applications = flattened;

        $scope.loadMoreApplications();


    };

    function processUtilities(response) {

        let tmp = [];
        response.data.sort(function (a, b) {
            let textA = a.utName.toUpperCase();
            let textB = b.utName.toUpperCase();
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });

        $scope.utilities = [];
        $scope.utilities = response.data;



        getExistingForeignKeys();

    }

    function processConsumers(response) {

        let tmp = [];

        response.data = response.data.filter(function (item) {
            return item.cuNameLast !== null;
        });


        if($scope.utilityFilter != -1) {
            response.data = response.data.filter(function (item) {
                return item.rbUtilityID === $scope.utilityFilter;
            });
        }


        response.data.sort(function (a, b) {

            let textA = a.cuNameLast.toUpperCase() ;

            let textB = b.cuNameLast.toUpperCase();

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



            var letter = response.data[i].cuNameLast.charAt(0);

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
                flattened.push({cuNameLast: property, type: 'letter'});
                //then push the items in the letter
                for (let i = 0; i < tmp[property].length; i++) {
                    tmp[property][i].type = 'record';
                    flattened.push(tmp[property][i]);
                }
            }
        }
        $scope.consumers = [];
        $scope.consumers = flattened;


    };

    function processConsumerTypes(response) {

        let tmp = [];
        response.data.sort(function (a, b) {
            let textA = a.ctCustomerType.toUpperCase();
            let textB = b.ctCustomerType.toUpperCase();
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });

        $scope.consumerTypes = [];
        $scope.consumerTypes = response.data;



    };

    function processPrograms(response) {


        response.data = response.data.filter(function (item) {
            return item.prName !== null;
        });

        let tmp = [];
        response.data.sort(function (a, b) {
            let textA = a.prName.toUpperCase();
            let textB = b.prName.toUpperCase();
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });

        $scope.programs = [];
        $scope.programs = response.data;



    };

    function processMeasures(response) {

        response.data = response.data.filter(function (item) {
            return item.meName !== null;
        });


        let tmp = [];
        response.data.sort(function (a, b) {
            let textA = a.meName.toUpperCase();
            let textB = b.meName.toUpperCase();
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });

        $scope.measures = [];
        $scope.measures = response.data;



    };

    function processForeignKeys(response) {

        console.log("Response",response.data);

        var tempUtil = $scope.utilities;

        angular.forEach(response.data, function(value, key) {

            $scope.existingUtilityIDs.push(value.rbUtilityID);

        });

        tempUtil = tempUtil.filter(function (item) {

            return $scope.existingUtilityIDs.indexOf(item.utUtilityID) !== -1;

        });

        $scope.currentExisitingUtilityData = tempUtil;



    }

    $scope.loadMoreApplications = function () {
        if ($scope.scrollMode && $scope.applications.length !== 0) {
            var temp = $scope.applications.slice($scope.offset , $scope.offset + offset_increment);

            angular.forEach(temp, function(value, key) {
                $scope.currentApplicationData.push(value);
            });

            $scope.offset += offset_increment;
        }
    };

    $scope.filterByUtility = function(data) {

        if ($scope.form.edit) {
            //if we are in edit mode, don't allow changing of records
            return false;
        }

        if (data.record['utUtilityID'] == $scope.utilityFilter) {

            $scope.utilityFilter = -1;

            $scope.selectedUtilityID = -1;

            $scope.currentApplicationData = [];

            $scope.offset = 0;

            getApplicationsWithConsumers();

            return false;
        }

        $scope.highlightCorrectUtility(data);

        $scope.utilityFilter = data.record['utUtilityID'];

        $scope.currentApplicationData = [];

        $scope.offset = 0;

        getApplicationsWithConsumers();

    };


    $scope.highlightCorrectUtility= function (data) {

        $scope.selectedUtilityID = data.record['utUtilityID'];

    };

    $scope.highlightCorrectRecord = function (data) {

        $scope.selectedApplicationID = data.record['rbApplicationID'];
        getUtilityById(data.record['rbUtilityID']);

        getConsumerTypeById(data.record['rbCustomerTypeID']);

        getConsumerById(data.record['rbCustomerID']);

        getProgramById(data.record['rbProgramID']);

        getMeasureById(data.record['rbCustomerTypeID']);

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
            data.record.rbEntryDate = new Date(data.record.rbEntryDate);

            data.record.rbCompleteDate = new Date(data.record.rbCompleteDate);

            data.record.rbDatePurchased = new Date(data.record.rbDatePurchased);

            $scope.form.master = data.record; //for reset of form (cancel)
            angular.copy($scope.form.master, $scope.form.user);
            $scope.view.record = data.record;
        }
        else {
            console.log("Data for single view not supplied.");
        }
    };

    function assignCurrentUtility(response) {

        $scope.selectedUtility = response.data[0];

        var count = 0;

        angular.forEach($scope.utilities , function(value, key) {
            if (value.utUtilityID == $scope.selectedUtility.utUtilityID) {
                $scope.utilitySelect = $scope.utilities[count];
            }
            count++;
        });



    }


    function assignCurrentConsumerType(response) {

        $scope.selectedConsumerType = response.data[0];

        var count = 0;

        angular.forEach($scope.consumerTypes , function(value, key) {
            if (value.ctCustomerTypeID == $scope.selectedConsumerType.ctCustomerTypeID) {
                $scope.consumerTypeSelect = $scope.consumerTypes[count];
            }
            count++;
        });



    }

    function assignCurrentConsumer(response) {

        $scope.selectedConsumer = response.data[0];

        var count = 0;

        angular.forEach($scope.consumers , function(value, key) {
            if (value.cuCustomerID == $scope.selectedConsumer.cuCustomerID) {
                $scope.consumerSelect = $scope.consumers[count];
            }
            count++;
        });



    }

    function assignCurrentProgram(response) {

        $scope.selectedProgram = response.data[0];

        var count = 0;

        angular.forEach($scope.programs, function(value, key) {
            if (value.prProgramID == $scope.selectedProgram.prProgramID) {
                $scope.programSelect = $scope.programs[count];
            }
            count++;
        });



    }

    function assignCurrentMeasure(response) {

        $scope.selectedMeasure = response.data[0];

        var count = 0;

        angular.forEach($scope.measures, function(value, key) {
            if (value.meMeasureID == $scope.selectedMeasure.meMeasureID) {
                $scope.measureSelect = $scope.measures[count];
            }
            count++;
        });



    }


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


    $scope.onUtilitySelected = function(utility) {

        $scope.form.user.rbUtilityID = utility.utUtilityID;

    };

    $scope.onConsumerSelected = function(consumer) {

        $scope.form.user.rbConsumerID = consumer.cuCustomerID;

    };

    $scope.onConsumerTypeSelected = function(consumerType) {

        $scope.form.user.rbCustomerTypeID = consumerType.ctCustomerTypeID;

    };

    $scope.onProgramSelected = function(program) {

        $scope.form.user.rbProgramID = program.prProgramID;

    };

    $scope.onMeasureSelected = function(measure) {

        $scope.form.user.meMeasureID = measure.meMeasureID;

    };

    $scope.createRecord = function () {


        var data = {
            "table" : "Application",
            "values" : $scope.form.user
        };

        if ($scope.form.user.rbEntryDate ) {$scope.form.user.rbEntryDate = new Date($scope.form.user.rbEntryDate).toMysqlFormat();}
        if ($scope.form.user.rbCompleteDate ) {$scope.form.user.rbCompleteDate = new Date($scope.form.user.rbCompleteDate).toMysqlFormat();}
        if ($scope.form.user.rbDatePurchased ) {$scope.form.user.rbDatePurchased = new Date($scope.form.user.rbDatePurchased).toMysqlFormat();}


        DS.createRecord(data).then(updateSuccess, updateFailure)
            .finally(function () {
                console.log("finally");
            });

    };

    $scope.deleteSingleApplication = function () {

        DS.deleteApplication($scope.view.record)
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
            getApplicationsWithConsumers();
            $scope.loadSingleView({record: {}});
        }
        else if (response.config.url.indexOf('new') >= 0) {
            message.text = 'Record created!';
            getApplicationsWithConsumers();
            $scope.loadSingleView({record: response.data.values});
        }
        else if (response.config.url.indexOf('update') >= 0) {
            message.text = 'Record updated!';
            getApplicationsWithConsumers();
            $scope.loadSingleView({record: response.data.values});
        }
        else {
            message.text = 'Success!';
            getApplicationsWithConsumers();
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

        getApplicationsWithConsumers();
    }

    $scope.updateSingleApplication = function () {

        DS.updateApplication($scope.form.user)
            .then(updateSuccess, updateFailure)
            .finally(function () {
                console.log("finally");
            });

    };


    $scope.addNewRecord = function () {
        $scope.view.record = {};
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

    $scope.loadDataSet = function (searchTerm) {

        var termLength = searchTerm.length;

        if (termLength == 0) {

            $scope.scrollMode = true;
            $scope.offset = 0;
            $scope.currentApplicationData = [];
            $scope.loadMoreApplications();

        }

        if ( termLength >= 3) {

            $scope.scrollMode = false;
            console.log(termLength);
            let subString = String(searchTerm).toUpperCase();

            let tempData = [];

            angular.forEach($scope.applications, function (value, key) {

                if (value.cuNameLast.length >= termLength) {
                    if (value.cuNameLast.toUpperCase().indexOf(subString) !== -1) {
                        tempData.push($scope.applications[key]);
                    }
                }

            });

            $scope.currentApplicationData = tempData;

        }

    };





}]);