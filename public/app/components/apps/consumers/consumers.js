/**
 * Created by Corey on 8/8/17.
 */
'use strict';

app.controller('ConsumersCtrl', ['$scope', '$rootScope', 'DataService.api', 'MessagingService', 'authService', function ($scope, $rootScope, DS, MS, authService) {
    var vm = this;
    vm.auth = authService;

    $scope.offset = 0;
    var offset_increment = 50;

    var utilityOffset = 0;
    var utilityOffsetIncrement = 25;

    $scope.scrollMode = true;

    $scope.currentData = [];

    $scope.currentUtilityData = [];

    $scope.currentExisitingUtilityData = [];

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
    $scope.utilities = [];
    $scope.existingUtilityIDs = [];
    $scope.letters = [];
    $scope.form = {
        edit: false,
        master: {},
        user: {},
        activeclass: ''
    };

    getExistingUtilities();
    getConsumers();
    getUtilities();
    getConsumerTypes();


    function getConsumers(callback) {

        DS.getConsumers().then(processConsumers);
        if (callback) {
            callback();
        }
    }

    function getUtilities(callback) {

        DS.getUtilities().then(processUtilities);
        if (callback) {
            callback();
        }
    }

    function getExistingUtilities(callback) {
        DS.getExistingUtilities().then(processExistingUtilities);
    }

    function getUtilityById(id) {
        DS.getUtility(id).then(assignCurrentUtility);
    }

    function getConsumerTypes(callback) {
        DS.getConsumerTypes().then(processConsumerTypes);
    }

    function getConsumerTypeById(id) {
        DS.getConsumerType(id).then(assignCurrentConsumerType);
    }

    function processConsumers(response) {
        console.log(response.data);
        let tmp = [];
        response.data = response.data.filter(function (item) {
            return item.cuNameLast !== null;
        });
        if ($scope.utilityFilter != -1) {
            response.data = response.data.filter(function (item) {
                return item.cuUtilityID === $scope.utilityFilter;
            });
        }
        response.data.sort(function (a, b) {
            let textA = a.cuNameLast.toUpperCase();
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
        $scope.data = [];
        $scope.data = flattened;
        $scope.loadMore();


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
        $scope.loadMoreUtilities();

        console.log($scope.utilities);
        getExistingUtilities();


    }

    function processExistingUtilities(response) {


        var temp = $scope.utilities;

        angular.forEach(response.data, function (value, key) {
            $scope.existingUtilityIDs.push(value.utUtilityID);
        });


        temp = temp.filter(function (item) {

            return $scope.existingUtilityIDs.indexOf(item.utUtilityID) !== -1;

        });

        $scope.currentExisitingUtilityData = temp;


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

    $scope.loadMoreUtilities = function () {
        if ($scope.utilities.length !== 0) {
            var temp = $scope.utilities.slice(utilityOffset, utilityOffset + utilityOffsetIncrement);

            angular.forEach(temp, function (value, key) {
                $scope.currentUtilityData.push(value);
            });

            utilityOffset += utilityOffsetIncrement;
        }
    };

    $scope.highlightCorrectRecord = function (data) {

        $scope.selectedConsumerID = data.record['cuCustomerID'];
        getUtilityById(data.record['cuUtilityID']);
        getConsumerTypeById(data.record['cuCustomerTypeID']);


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

            getConsumers();

            return false;
        }

        $scope.highlightCorrectUtility(data);

        $scope.utilityFilter = data.record['utUtilityID'];

        $scope.currentData = [];

        $scope.offset = 0;

        getConsumers();

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


    $scope.updateSingleConsumer = function () {

        DS.updateConsumer($scope.form.user)
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
            getConsumers();
            $scope.loadSingleView({record: response.data.values});
        }
        else if (response.config.url.indexOf('update') >= 0) {
            message.text = 'Record updated!';
            getConsumers();
            $scope.loadSingleView({record: response.data.values});
        }
        else {
            message.text = 'Success!';
            getConsumers();
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
        getConsumers();

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


    //When Utility is selected from dropdown in form for Consumer
    $scope.onUtilitySelected = function (utility) {

        $scope.form.user.cuUtilityID = utility.utUtilityID;

        getConsumers();
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
            "table": "Customer",
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

        if (termLength >= 3) {

            $scope.scrollMode = false;
            console.log(termLength);
            let subString = String(searchTerm).toUpperCase();

            let tempData = [];

            angular.forEach($scope.data, function (value, key) {

                if (value.cuNameLast != null) {
                    if (value.cuNameLast.length >= termLength) {
                        if (value.cuNameLast.toUpperCase().indexOf(subString) !== -1) {
                            tempData.push($scope.data[key]);
                        }
                    }
                }

                if (value.cuNameFirst != null) {
                    if (value.cuNameFirst.length >= termLength) {
                        if (value.cuNameFirst.toUpperCase().indexOf(subString) !== -1) {
                            tempData.push($scope.data[key]);
                        }
                    }
                }

                if (value.eMail != null) {
                    if (value.eMail.length >= termLength) {
                        if (value.eMail.toUpperCase().indexOf(subString) !== -1) {
                            tempData.push($scope.data[key]);
                        }
                    }
                }

                if (value.cuPhone != null) {
                    if (value.cuPhone.length >= termLength) {
                        if (value.cuPhone.toUpperCase().indexOf(subString) !== -1) {
                            tempData.push($scope.data[key]);
                        }
                    }
                }

                if (value.cuUtilityCustomerAccountNo != null) {
                    if (value.cuUtilityCustomerAccountNo.length >= termLength) {
                        if (value.cuUtilityCustomerAccountNo.toUpperCase().indexOf(subString) !== -1) {
                            tempData.push($scope.data[key]);
                        }
                    }
                }

            });


            $scope.currentData = tempData;

        }

    }


    $scope.onConsumerTypeSelected = function (consumerType) {

        $scope.form.user.cuCustomerTypeID = consumerType.ctCustomerTypeID;

    };


}]);