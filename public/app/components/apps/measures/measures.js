/**
 * Created by Corey on 8/28/17.
 */
app.controller('MeasuresCtrl', ['$scope', '$rootScope', 'DataService.api', 'MessagingService', 'authService',  function ($scope, $rootScope, DS, MS, authService) {
    var vm = this;
    vm.auth = authService;

    $scope.offset = 0;
    var offset_increment = 50;

    var utilityOffset = 0;
    var utilityOffsetIncrement = 25;

    $scope.currentUtilityData = [];
    $scope.currentExisitingUtilityData = [];
    $scope.currentExisitingConsumerData = [];
    $scope.currentMeasureData = [];

    $scope.scrollMode = true;

    $scope.currentUtilityName = "";


    $scope.dayDateFormat = 'yyyy-MM-dd';
    $scope.timeDateFormat = 'MMM d, y h:mm:ss a';

    $scope.selectedMeasureID = -1;
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
    $scope.programs = [];
    $scope.measures = [];


    $scope.existingUtilityIDs = [];
    $scope.existingConsumerIDs = [];
    $scope.letters = [];
    $scope.form = {
        edit: false,
        master: {},
        user: {},
        activeclass: ''
    };

    getUtilities();
    getMeasures();
    getPrograms();

    function getUtilities() {
        DS.getUtilities().then(processUtilities);
    }

    function getExistingUtilities(callback) {

        DS.getExistingUtilitiesMeasures().then(processExistingUtilities);
    }

    function getMeasures(callback) {

        DS.getMeasures().then(processMeasures);
    }

    function getPrograms(callback) {

        DS.getPrograms().then(processPrograms);
    }

    function getUtilityById(id) {

        DS.getUtility(id).then(assignCurrentUtility);
    }

    function getProgramById(id) {

        DS.getProgram(id).then(assignCurrentProgram);
    }



    function processUtilities(response) {

        let tmp = [];
        response.data.sort(function (a, b) {
            let textA = a.utName.toUpperCase();
            let textB = b.utName.toUpperCase();
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });

        $scope.utilities = [];
        $scope.utilities = response.data;

        getExistingUtilities();



    }

    function processExistingUtilities(response) {

        var temp = $scope.utilities;

        angular.forEach(response.data, function(value, key) {
            $scope.existingUtilityIDs.push(value.utUtilityID);
        });

        temp = temp.filter(function (item) {

            return $scope.existingUtilityIDs.indexOf(item.utUtilityID) !== -1;

        });

        $scope.currentExisitingUtilityData = temp;


    }

    function processMeasures(response) {

        let tmp = [];

        response.data = response.data.filter(function (item) {
            return item.meName !== null;
        });


        if($scope.utilityFilter != -1) {
            response.data = response.data.filter(function (item) {
                return item.meUtilityID === $scope.utilityFilter;
            });
        }


        response.data.sort(function (a, b) {

            let textA = a.meName.toUpperCase() ;

            let textB = b.meName.toUpperCase();

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


            // TODO: Put Date Type Casting HERE


            var letter = response.data[i].meName.charAt(0);

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
                flattened.push({meName: property, type: 'letter'});
                //then push the items in the letter
                for (let i = 0; i < tmp[property].length; i++) {
                    tmp[property][i].type = 'record';
                    flattened.push(tmp[property][i]);
                }
            }
        }
        $scope.measures = [];
        $scope.measures = flattened;

        $scope.loadMoreMeasures();


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


    $scope.loadMoreMeasures = function () {
        if ($scope.measures.length !== 0) {
            var temp = $scope.measures.slice($scope.offset , $scope.offset + offset_increment);

            angular.forEach(temp, function(value, key) {
                $scope.currentMeasureData.push(value);
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

            $scope.currentMeasureData = [];

            $scope.offset = 0;

            getMeasures();

            return false;
        }

        $scope.highlightCorrectUtility(data);

        $scope.utilityFilter = data.record['utUtilityID'];

        $scope.currentMeasureData = [];

        $scope.offset = 0;

        getMeasures();

    };

    $scope.highlightCorrectUtility= function (data) {

        $scope.selectedUtilityID = data.record['utUtilityID'];

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

    $scope.highlightCorrectRecord = function (data) {

        $scope.selectedMeasureID = data.record['meMeasureID'];

        getUtilityById(data.record['meUtilityID']);

        getProgramById(data.record['meProgramID']);

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


    function assignCurrentUtility(response) {

        $scope.selectedUtility = response.data[0];

        $scope.currentUtilityName = $scope.selectedUtility.utName;

        var count = 0;

        angular.forEach($scope.utilities , function(value, key) {
            if (value.utUtilityID == $scope.selectedUtility.utUtilityID) {
                $scope.utilitySelect = $scope.utilities[count];
            }
            count++;
        });



    }

    function assignCurrentProgram(response) {


        $scope.selectedProgram = response.data[0];

        var count = 0;

        console.log($scope.selectedProgram);

        angular.forEach($scope.programs, function(value, key) {
            if (value.prProgramID == $scope.selectedProgram.prProgramID) {
                $scope.programSelect = $scope.programs[count];
            }
            count++;
        });



    }

    $scope.deleteSingleMeasure = function () {

        DS.deleteMeasure($scope.view.record)
            .then(updateSuccess, updateFailure)
            .finally(function () {
                console.log("finally");
            });

    };

    $scope.createRecord = function () {

        var data = {
            "table" : "Measure",
            "values" : $scope.form.user
        };

        DS.createRecord(data).then(updateSuccess, updateFailure)
            .finally(function () {
                console.log("finally");
            });

    };

    $scope.updateSingleMeasure = function () {

        DS.updateMeasure($scope.form.user)
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
            getMeasures();
            $scope.loadSingleView({record: {}});
        }
        else if (response.config.url.indexOf('new') >= 0) {
            message.text = 'Record created!';
            getMeasures();
            $scope.loadSingleView({record: response.data.values});
        }
        else if (response.config.url.indexOf('update') >= 0) {
            message.text = 'Record updated!';
            getMeasures();
            $scope.loadSingleView({record: response.data.values});
        }
        else {
            message.text = 'Success!';
            getMeasures();
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

    $scope.loadDataSet = function (searchTerm) {

        var termLength = searchTerm.length;

        if (termLength == 0) {

            $scope.scrollMode = true;
            $scope.offset = 0;
            $scope.currentMeasureData = [];
            $scope.loadMoreMeasures();

        } else {

            $scope.scrollMode = false;
            console.log(termLength);
            let subString = searchTerm;

            let tempData = [];

            angular.forEach($scope.measures, function (value, key) {

                if (value.meName.length >= termLength) {
                    if (value.meName.substring(0, termLength).indexOf(subString) !== -1) {
                        tempData.push($scope.measures[key]);
                    }
                }

            });

            $scope.currentMeasureData = tempData;

        }

    }


    $scope.onUtilitySelected = function (utility) {

        $scope.form.user.meUtilityID = utility.utUtilityID;

        getMeasures();
    };


    $scope.onProgramSelected = function (program) {

        $scope.form.user.meProgramID = program.prProgramID;

        getMeasures();
    };


    $scope.loadDataSet = function (searchTerm) {

        var termLength = searchTerm.length;

        if (termLength == 0) {

            $scope.scrollMode = true;
            $scope.offset = 0;
            $scope.currentMeasureData = [];
            $scope.loadMoreMeasures();

        }

        if ( termLength >= 3) {

            $scope.scrollMode = false;
            let subString = String(searchTerm).toUpperCase();

            let tempData = [];

            angular.forEach($scope.measures, function (value, key) {

                if (value.meName.length >= termLength) {
                    if (value.meName.toUpperCase().indexOf(subString) !== -1) {
                        tempData.push($scope.measures[key]);
                    }
                }

            });

            $scope.currentMeasureData = tempData;

        }

    }



}]);