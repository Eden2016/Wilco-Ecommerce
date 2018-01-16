'use strict';
//LoginService factory

app.factory('LoginService', ['$rootScope', 'DataService.api', 'MessagingService', '$localStorage', '$state', 'jwtHelper', function ($rootScope, DS, MS, $localStorage, $state, jwtHelper) {
    var isAuthenticated = [false];
    $rootScope.user = {};
    $rootScope.user.isAuthenticated = isAuthenticated;

    if ($localStorage.token){
        let exp = jwtHelper.isTokenExpired($localStorage.token);
        if (exp){
            $state.transitionTo('login');
        } else{
            isAuthenticated = [true];
        }
    }

    return {
        login: function (username, password) {
            if (username && password) {
                var res = DS.login({"email": username, "password": password}).then(res => {
                    console.log(res);
                    if (res.type === false) {
                        console.log("User does not exist");
                        MS.addMessage({
                            id: Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36),
                            text: 'User does not exist.',
                            type: 'alert',
                            platform: 'server'
                        });
                    } else {
                        $rootScope.user.who = res.data.ret[0];
                        $localStorage.token = res.data.ret[0]['token'];
                        //delete $rootScope.user.who.token; //remove token from user object?
                        isAuthenticated = [true];
                        $state.transitionTo('dashboard');
                        console.log("$rootScope.isAuthenticated");
                        console.log($rootScope.isAuthenticated);
                    }
                }, err => {
                    console.log("Database Error - Please contact support.");
                    $state.transitionTo('login');
                    console.log("$rootScope.isAuthenticated");
                    console.log($rootScope.isAuthenticated);
                    MS.addMessage({
                        id: Math.random().toString(36).substring(2) + (new Date()).getTime().toString(36),
                        text: 'Database Error - Please contact support.',
                        type: 'alert',
                        platform: 'server'
                    });
                });

            }
        },
        isAuthenticated: function () {
            return $rootScope.user.isAuthenticated[0];
        },
        isExpired: function() {
            if ($localStorage.token){
                let tval = jwtHelper.isTokenExpired($localStorage.token);
            }
            return tval;
        }
    };

}]);
