/**
 * Created by Corey on 8/8/17.
 */
'use strict';

app.controller('SystemUsersCtrl', ['$scope', '$rootScope', 'DataService.api', 'MessagingService', 'authService', '$http', 'angularAuth0',  function ($scope, $rootScope, DS, MS, authService, $http, angularAuth0) {
    var vm = this;
    vm.auth = authService;

    vm.auth0Provider = angularAuth0;


    var API_URL = 'https://wilco.auth0.com/api/v2';
    vm.message = '';

    $scope.offset = 0;
    var offset_increment = 50;

    var utilityOffset = 0;
    var utilityOffsetIncrement = 25;

    $scope.currentData = [];

    $scope.currentUtilityData = [];

    $scope.currentExisitingUtilityData = [];

    $scope.selectedFilter = "None";

    $scope.dayDateFormat = 'yyyy-MM-dd';

    $scope.timeDateFormat = 'MMM d, y h:mm:ss a';

    $scope.selectedConsumerID = -1;

    $scope.selectedUtilityID = -1;

    $scope.selectedUtility = null;

    $scope.utilityFilter = -1;

    $scope.utilitySelect = {};

    $scope.view = {
        record: {},
        highlightedItem: {},
        message: {},
        existingRecord: false
    };

    $scope.users = [];
    $scope.utilities = [];
    $scope.existingUtilityIDs = [];
    $scope.letters = [];
    $scope.form = {
        edit: false,
        master: {},
        user: {},
        activeclass: ''
    };

    getUsers();

    function getUsers() {



        DS.getUsers().then(processUsers);
    }


    function processUsers(response) {
        console.log(response.data);

        let tmp = [];

        response.data.sort(function (a, b) {

            let textA = a.nickname.toUpperCase() ;

            let textB = b.nickname.toUpperCase();

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



            var letter = response.data[i].nickname.charAt(0);


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
                flattened.push({nickname: property, type: 'letter'});
                //then push the items in the letter
                for (let i = 0; i < tmp[property].length; i++) {
                    tmp[property][i].type = 'record';
                    flattened.push(tmp[property][i]);
                }
            }
        }
        $scope.users = [];
        $scope.users = flattened;




    }





}]);