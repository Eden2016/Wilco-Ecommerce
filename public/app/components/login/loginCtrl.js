//Login Controller

app.controller('LoginCtrl', ['$scope', 'DataService.api', '$state','authService','MessagingService',  function ($scope, DS, $state, authService, MS) {
    // write Ctrl here
    $scope.test = {
        text: 'test login'
    };
    
    authService.lock.show();

    $scope.formSubmit = function () {
        authService.login();
    }


}]);