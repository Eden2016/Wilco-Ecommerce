//Login Controller

app.controller('LoginCtrl', ['$scope', 'DataService.api', '$state','authService','MessagingService',  function ($scope, DS, $state, authService, MS) {
    // write Ctrl here
    $scope.test = {
        text: 'test login'
    };

    var urlForRedirect = window.location.protocol + '//' + window.location.host + '/callback';

    authService.lock.show({auth: {params: {redirectUri: urlForRedirect}}});

    $scope.formSubmit = function () {
        authService.login();
    }


}]);