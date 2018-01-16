'use strict';

/* Controllers */


app.controller('BodyCtrl', ['$scope','$http',function ($scope, $http) {
    $scope.isLoading = function () {
        return $http.pendingRequests.length > 0;
    };
}]);

app.controller('AppsCtrl', function ($scope) {
});

app.controller('ToastCtrl', ['$scope', 'MessagingService', 'ngToast', function ($scope, MS, ngToast) {
    const iconTable = {
        alert: 'fi-alert',
        warning: 'fi-unlink',
        success: 'fi-check',
        info: 'fi-lightbulb'
    };
    $scope.mqueue = MS.messages.mqueue;
    $scope.$watchCollection('mqueue', function (newValue, oldValue) {
        //we might have multiple messages being queued up so we will use the array
        angular.forEach(newValue, function (value, key) {
            if (value.processed !== true) {
                let content = '';

                content += [
                    '<div data-closable class="alert-box callout ' + value.type +'">',
                    '<i class="' + iconTable[value.type] + '"></i> '+value.text,
                    '<button class="close-button" aria-label="Dismiss alert" type="button" data-close>',
                    '<i class="fi-x-circle"></i>',
                    '</button>',
                    '</div>'].join('');

                ngToast.create({
                    className: value.type,
                    content: content,
                    timeout: 2000
                });
                value.processed = true;

                //@todo: delete the item so that we aren't constantly cycling through old items
            }
        });
    });
}]);
