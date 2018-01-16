'use strict';

app.factory('MessagingService', ['$rootScope', function ($rootScope) {
    //client side messages
    $rootScope.messages = {
        mqueue: []
    };

    // var message = {
    //     id: ,
    //     text: 'This is the message text.',
    //     type: ['alert','warning','success','info'],
    //     platform: ['client','server'],
    //     processed: false
    // };

    $rootScope.addMessage = function (message) {
        //console.log('addMessage fired');
        if (!message){
            //console.error("no message supplied, ignoring...");
            return false;
        }
        // console.log(message);
        message.processed = false;
        $rootScope.messages.mqueue.push(message);
    };

    $rootScope.removeMessage = function (message) {

    };


    return {
        addMessage: $rootScope.addMessage,
        removeMessage: $rootScope.removeMessage,
        messages: $rootScope.messages
    };
}]);
