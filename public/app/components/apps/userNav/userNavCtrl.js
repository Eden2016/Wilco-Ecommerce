'use strict';

app.controller('UserNavCtrl', ['authService','$state',function (authService, $state) {
    var vm = this;
    vm.auth = authService;
    vm.profile;

    if (authService.getCachedProfile()) {
        vm.profile = authService.getCachedProfile();
    } else {
        authService.getProfile(function(err, profile) {
            vm.profile = profile;
        });
    }


    vm.runLogout = function () {
        console.log('Logging out...');
        vm.auth.logout();
        $state.transitionTo('login');
    }
}]);
