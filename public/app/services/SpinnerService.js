'use strict';

app.service('SpinnerService', ['$rootScope', '$timeout', function ($rootScope, $timeout) {
    $rootScope.loadingStatus = {
        status: ''
    };
    this.loadingStatus = $rootScope.loadingStatus;

    this.setLoadingStatus = function () {
        $rootScope.loadingStatus.status = 'loading';
    };
    this.removeLoadingStatus = function () {
        $rootScope.loadingStatus.status = '';
    };
}]);
