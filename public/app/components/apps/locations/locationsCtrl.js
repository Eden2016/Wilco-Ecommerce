/**
 * Created by Corey on 8/8/17.
 */
'use strict';

app.controller('LocationsCtrl', ['$scope', '$rootScope', 'DataService.api', 'MessagingService', 'authService', 'NgMap', function ($scope, $rootScope, DS, MS, authService, NgMap) {
    var vm = this;
    vm.auth = authService;
    vm.profile = authService.getRealUserProfile();
    var ourMap;

    $scope.cityCircle = null;

    NgMap.getMap().then(function(map) {

        ourMap = map;
        $scope.updateCircle(ourMap);

    });


    $scope.data = [];
    $scope.selectedUtility = null;
    $scope.currentLatitude = vm.profile['https://esg.digital/latitude'];
    $scope.currentLongitude = vm.profile['https://esg.digital/longitude'];
    $scope.selected = false;

    //Populate scope.data with utilities from db
    getUtilities();

    $scope.deselectLocation = function() {
        $scope.selected = false;
        $scope.selectedUtility = null;
        $scope.selectedUtilityID = null;

        jQuery(document).find('.active ').removeClass('active');
    };

    $scope.highlightCorrectLocation = function (data) {
        $scope.selectedUtilityID = data.record['utUtilityID'];
    };

    $scope.loadClickedLocation = function (data) {

        console.log("Here");

        if (data.record['type'] === "letter") {
            //if we are in edit mode, don't allow changing of records
            return false;
        }

        $scope.selected = true;
        $scope.selectedUtility = data.record;
        $scope.contactName = data.record['Utility Contact'];
        $scope.contactEmail = data.record['Utility Contact Email'];
        $scope.contactPhone = data.record['Utility Contact Phone'];

        $scope.selectedDistance = google.maps.geometry.spherical.computeDistanceBetween( new google.maps.LatLng($scope.currentLatitude, $scope.currentLongitude),  new google.maps.LatLng(data.record['latitude'], data.record['longitude'])) / 1609;
        $scope.highlightCorrectLocation(data);

    };

    $scope.loadClickedMarker = function (nothing, childScope) {

        var data = childScope.utility;


        if (data['type'] === "letter") {
            //if we are in edit mode, don't allow changing of records
            return false;
        }

        $scope.selected = true;
        $scope.selectedUtility = data;
        $scope.contactName = data['Utility Contact'];
        $scope.contactEmail = data['Utility Contact Email'];
        $scope.contactPhone = data['Utility Contact Phone'];

        $scope.selectedDistance = google.maps.geometry.spherical.computeDistanceBetween( new google.maps.LatLng($scope.currentLatitude, $scope.currentLongitude),  new google.maps.LatLng(data['latitude'], data['longitude'])) / 1609;
        $scope.highlightCorrectLocationByMarker(data);

    };

    $scope.highlightCorrectLocationByMarker = function (data) {
        $scope.selectedUtilityID = data['utUtilityID'];
    };



    function getUtilities(callback) {

        DS.getUtilities().then(processUtilities);
        if (callback) {
            callback();
        }
    }

    function processUtilities(response) {

        // console.log(response);
        let tmp = [];
        response.data.sort(function (a, b) {
            let textA = a.utName.toUpperCase();
            let textB = b.utName.toUpperCase();
            return (textA < textB) ? -1 : (textA > textB) ? 1 : 0;
        });


        //build letter grid
        for (let i = 0; i < response.data.length; i++) {
            if (!response.data[i].latitude && !response.data[i].longitude) {
                continue;
            }

            if(!((160934 * 2)>= google.maps.geometry.spherical.computeDistanceBetween( new google.maps.LatLng($scope.currentLatitude, $scope.currentLongitude),  new google.maps.LatLng(response.data[i].latitude, response.data[i].longitude)))) {
                continue;
            }

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

        console.log("Get Utilities");
        console.log($scope.data);


    }

    $scope.searchAddress = function () {
        console.log($scope.addressSearch);

        //Geocode Address
        DS.geocode($scope.addressSearch).then(handleAddress);



    }

    function handleAddress(response) {
        console.log(response);

        $scope.currentLatitude = response.data.results[0].geometry.location.lat;
        $scope.currentLongitude = response.data.results[0].geometry.location.lng;

        ourMap.setCenter(new google.maps.LatLng($scope.currentLatitude, $scope.currentLongitude));

        $scope.updateCircle(ourMap);

        getUtilities();
    }


    $scope.updateCircle = function (map) {


        if ($scope.cityCircle) {
            $scope.deselectLocation();

            $scope.cityCircle.setMap(null);
            $scope.cityCircle.setMap(map);
            $scope.cityCircle.setCenter(map.getCenter());

        } else {

            $scope.cityCircle = new google.maps.Circle({
                strokeColor: '#FFFFFF',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#0000FF',
                fillOpacity: 0.1,
                map: map,
                center: map.getCenter(),
                radius: 160934 * 2 //meter
            });

        }
    };

    $scope.deselectUtility = function() {
        $scope.selectedUtilityID = -1;
        $scope.selectedUtility = null;
    }



}]);