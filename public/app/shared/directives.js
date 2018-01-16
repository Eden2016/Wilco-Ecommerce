'use strict';

/* Directives */

// angular.module('esgApp.directives', []).
//   directive('appVersion', function (version) {
//     return function(scope, elm, attrs) {
//       elm.text(version);
//     };
//   });

app.directive('appNav', function () {
    return {
        templateUrl: 'app/components/apps/appNav.html',
    }
});

app.directive('mainNav', function () {
    return {
        templateUrl: 'app/components/apps/mainNav/mainNav.html',
        controller: 'MainNavCtrl'
    };
});

app.directive('userNav', function () {
    return {
        templateUrl: 'app/components/apps/userNav/userNav.html',
        controller: 'UserNavCtrl',
        controllerAs: 'vm'
    };
});

app.directive('globalToast', ['MessagingService', function (MS) {
    return {
        restrict: 'E',
        templateUrl: 'app/components/global-toast/globalToast.html',
        replace: false,
        controller: 'ToastCtrl'
    };
}]);


// app.directive('d-link', function(){
//     return {
//         restrict: 'C', // call the directive on DOM elements with the class 'btn'
//         link: function( scope, elem, attr ){
//             elem.bind('click',function () {
//                 elem.closest('.dropdown-custom').hide();
//             });
//         }
//     }
// });


app.directive('loading', ['$http', function ($http) {
    return {
        restrict: 'A',
        link: function (scope, elm, attrs) {
            scope.isLoading = function () {
                return $http.pendingRequests.length > 0;
            };
            scope.$watch(scope.isLoading, function (v) {
                if (v) {
                    elm.css('visibility', 'visible');
                    elm.css('opacity', 1);
                } else {
                    elm.css('visibility', 'hidden');
                    elm.css('opacity', 0);
                }
            });
        }
    };
}]);

