'use strict';

app.controller('UtilitiesCtrl', ['$scope', '$rootScope', 'DataService.api', 'MessagingService', 'authService', function ($scope, $rootScope, DS, MS, authService) {
    var vm = this;
    vm.auth = authService;

    $scope.dayDateFormat = 'yyyy-MM-dd';
    $scope.timeDateFormat = 'MMM d, y h:mm:ss a';

    $scope.geocoder = null;

    $scope.selectedUtilityID = -1;
    $scope.selectedStateID = -1;

    // write Ctrl here
    $scope.view = {
        record: {},
        highlightedItem: {},
        message: {},
        existingRecord: false,
    };

    $scope.data = [];
    $scope.state = [];


    $scope.letters = [];
    $scope.form = {
        edit: false,
        master: {},
        user: {},
        activeclass: ''
    };

    $scope.utilityFilter = -1;

    getUtilities();
    getUtilityStates();

    function getUtilities() {

        DS.getUtilities().then(processUtilities);
    }

    function getUtilityStates() {

        DS.getUtilityStates().then(processUtilityStates);
    }

    function processUtilities(response) {


        if($scope.utilityFilter != -1) {
            response.data = response.data.filter(function (item) {
                return item.utState === $scope.utilityFilter;
            });
        }

        // console.log(response);
        let tmp = [];
        response.data.sort(function (a, b) {
            let textA = a.utName.toUpperCase();
            let textB = b.utName.toUpperCase();
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });

        for (let i = 0; i < response.data.length; i++) {
            var letter = response.data[i].utName.charAt(0);

            response.data[i].ProgramStart = new Date(response.data[i].ProgramStart);

            response.data[i].FiscalYearStart = new Date(response.data[i].FiscalYearStart);

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
                flattened.push({utName: property, type: 'letter'});
                //then push the items in the letter
                for (let i = 0; i < tmp[property].length; i++) {
                    tmp[property][i].type = 'record';
                    flattened.push(tmp[property][i]);
                }
            }
        }
        $scope.data = [];
        $scope.data = flattened;


    };

    function processUtilityStates(response) {

        response.data = response.data.filter(function (item) {
            return item.utState !== null;
        });

        let tmp = [];
        response.data.sort(function (a, b) {
            let textA = a.utState.toUpperCase();
            let textB = b.utState.toUpperCase();
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });

        $scope.states = [];

        angular.forEach(response.data, function(data, index){
            console.log("INDEX ", index, " DATA ", data);
            $scope.states.push({"utStateID" : index, "utState": data['utState']});
        });

        console.log("Scope ", $scope.states);



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

    $scope.updateSingleUtility = function () {

        if($scope.form.user.utAddress && $scope.form.user.utCity) {
            if ($scope.form.user.utAddress2) {
                var addressString = $scope.form.user.utAddress + " " + $scope.form.user.utAddress2 + " " + $scope.form.user.utCity;
                DS.geocode(addressString).then(processLatLng);
            } else {
                var addressString = $scope.form.user.utAddress + " " + $scope.form.user.utCity;
                DS.geocode(addressString).then(processLatLng);
            }
        }



    };

    function processLatLng(response) {

      $scope.form.user.latitude = response.data.results[0].geometry.location.lat;
      $scope.form.user.longitude = response.data.results[0].geometry.location.lng;

        DS.updateUtility($scope.form.user)
            .then(updateSuccess, updateFailure)
            .finally(function () {
                console.log("finally");
            });

    };

    $scope.deleteSingleUtility = function () {
        console.info('deleting utility...');
        console.log($scope.view.record);
        DS.deleteUtility($scope.view.record)
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
            getUtilities();
            $scope.loadSingleView({record: {}});
        }
        else if (response.config.url.indexOf('new') >= 0) {
            message.text = 'Record created!';
            getUtilities();
            $scope.loadSingleView({record: response.data.values});
        }
        else if (response.config.url.indexOf('update') >= 0) {
            message.text = 'Record updated!';
            getUtilities();
            $scope.loadSingleView({record: response.data.values});
        }
        else {
            message.text = 'Success!';
            getUtilities();
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
        getUtilities();

    }

    $scope.highlightCorrectRecord = function (data) {
        $scope.selectedUtilityID = data.record['utUtilityID'];


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
            console.log("DATA", data.record);


            if (data.record.ProgramStart ) {data.record.ProgramStart = new Date(data.record.ProgramStart);}
            if (data.record.FiscalYearStart ) {data.record.FiscalYearStart = new Date(data.record.FiscalYearStart);}


            $scope.form.master = data.record; //for reset of form (cancel)
            angular.copy($scope.form.master, $scope.form.user);
            $scope.view.record = data.record;
        }
        else {
            console.log("Data for single view not supplied.");
        }
    };

    $scope.processDateSelection = function (selectedDate) {
        console.log(selectedDate);
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

    $scope.createRecord = function () {

        if ($scope.form.user.ProgramStart ) {$scope.form.user.ProgramStart = new Date($scope.form.user.ProgramStart).toMysqlFormat();}
        if ($scope.form.user.FiscalYearStart ) {$scope.form.user.FiscalYearStart = new Date($scope.form.user.FiscalYearStart).toMysqlFormat();}

        var data = {
            "table" : "Utility",
            "values" : $scope.form.user
        };

        DS.createRecord(data).then(updateSuccess, updateFailure)
            .finally(function () {
                console.log("finally");
            });
    };

    function createRecordResponse () {
        console.log("Complete");
    }

    $scope.filterByState = function (data) {

        if ($scope.form.edit) {
            //if we are in edit mode, don't allow changing of records
            return false;
        }

        if (data.record['utState'] == $scope.utilityFilter) {

            $scope.utilityFilter = -1;

            $scope.selectedStateID = -1;

            $scope.currentData = [];

            $scope.offset = 0;

            getUtilities();

            return false;
        }


        $scope.highlightCorrectState(data);

        $scope.utilityFilter = data.record['utState'];

        $scope.currentData = [];

        $scope.offset = 0;

        getUtilities();

    };

    $scope.highlightCorrectState = function (data) {
        $scope.selectedStateID = data.record['utStateID'];
    };

    $scope.loadDataSet = function (searchTerm) {

        var termLength = searchTerm.length;


        if (termLength == 0) {

            $scope.offset = 0;
            $scope.data = [];
            getUtilities();

        }

        if ( termLength >= 3) {

            console.log(searchTerm)

            let subString = String(searchTerm).toUpperCase();

            let tempData = [];

            angular.forEach($scope.data, function (value, key) {

                if (value.utName != null) {
                    if (value.utName.length >= termLength) {
                        if (value.utName.toUpperCase().indexOf(subString) !== -1) {
                            tempData.push($scope.data[key]);
                        }
                    }
                }

                if (value['BPA ID Number'] != null) {
                    if (value['BPA ID Number'].length >= termLength) {
                        if (value['BPA ID Number'].toUpperCase().indexOf(subString) !== -1) {
                            tempData.push($scope.data[key]);
                        }
                    }
                }

                if (value['Utility Contact Phone'] != null) {
                    if (value['Utility Contact Phone'].length >= termLength) {
                        if (value['Utility Contact Phone'].toUpperCase().indexOf(subString) !== -1) {
                            tempData.push($scope.data[key]);
                        }
                    }
                }

                if (value.utMainContact != null) {
                    if (value.utMainContact.length >= termLength) {
                        if (value.utMainContact.toUpperCase().indexOf(subString) !== -1) {
                            tempData.push($scope.data[key]);
                        }
                    }
                }

                if (value.utMCPhone != null) {
                    if (value.utMCPhone.length >= termLength) {
                        if (value.utMCPhone.toUpperCase().indexOf(subString) !== -1) {
                            tempData.push($scope.data[key]);
                        }
                    }
                }

            });

            $scope.data = tempData;

        }

    }


}]);