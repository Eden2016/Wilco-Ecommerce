'use strict';

/**
 * You first need to create a formatting function to pad numbers to two digits…
 **/
function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
}

/**
 * …and then create the method to output the date string as desired.
 * Some people hate using prototypes this way, but if you are going
 * to apply this to more than one Date object, having it as a prototype
 * makes sense.
 **/
Date.prototype.toMysqlFormat = function() {
    return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate()) + " " + twoDigits(this.getUTCHours()) + ":" + twoDigits(this.getUTCMinutes()) + ":" + twoDigits(this.getUTCSeconds());
};


//our requested scopes go here
//we request all of the scopes available, then at the service level we have a rule in place
//which will only grant correct scopes out of the list of all scopes=
let REQUESTED_SCOPES = 'openid profile read:products update:products delete:products create:products';

// Declare app level module which depends on views, and components
var app = angular.module('esgApp', [
    'ui.tinymce',
    'auth0.auth0',
    'angular-jwt',
    'ui.router',
    'mm.foundation',
    'ngTouch',
    'ngSanitize',
    'ngAnimate',
    'duScroll',
    'ngToast',
    'bzm-date-picker',
    'ngMap',
    'infinite-scroll',
    'ui.grid',
    'ui.grid.infiniteScroll',
    'ui.grid.selection',
    'ui.grid.draggable-rows'
]);

app.config(['$stateProvider', '$locationProvider', '$urlRouterProvider', 'angularAuth0Provider', 'jwtOptionsProvider', '$httpProvider', function ($stateProvider, $locationProvider, $urlRouterProvider, angularAuth0Provider, jwtOptionsProvider, $httpProvider) {

    $stateProvider
        .state("login", {
            url: '/login',
            templateUrl: "app/components/login/login.html",
            controller: "LoginCtrl",
            authenticate: false,
            name: 'Login'
        })
        .state("dashboard", {
            url: '/dashboard',
            templateUrl: "app/components/dashboard/dashboard.html",
            controller: "DashboardCtrl",
            onEnter: checkAuthentication,
            controllerAs: 'vm',
            title: 'Dashboard'
        })
        .state("app", {
            url: '/app',
            templateUrl: "app/components/apps/apps.html",
            controller: "AppsCtrl",
            controllerAs: 'vm',
            onEnter: checkAuthentication
        })
        .state("app.consumers", {
            url: "/consumers",
            templateUrl: "app/components/apps/consumers/consumers.html",
            controller: "ConsumersCtrl",
            onEnter: checkAuthentication,
            name: 'Consumers',
            controllerAs: 'vm',
            title: 'Consumers'
        })
        .state("app.applications", {
            url: "/applications",
            templateUrl: "app/components/apps/applications/applications.html",
            controller: "ApplicationsCtrl",
            onEnter: checkAuthentication,
            name: 'Applications',
            controllerAs: 'vm',
            title: 'Applications'
        })
        .state("app.utilities", {
            url: "/utilities",
            templateUrl: "app/components/apps/utilities/utilities.html",
            controller: "UtilitiesCtrl",
            onEnter: checkAuthentication,
            controllerAs: 'vm',
            title: 'Utilities'
        })
        .state("app.locations", {
            url: "/locations",
            templateUrl: "app/components/apps/locations/locations.html",
            controller: "LocationsCtrl",
            onEnter: checkAuthentication,
            controllerAs: 'vm',
            title: 'Locations'
        })
        .state("app.measures", {
            url: "/measures",
            controller: "MeasuresCtrl",
            templateUrl: "app/components/apps/measures/measures.html",
            onEnter: checkAuthentication,
            controllerAs: 'vm',
            title: 'Measures'
        })
        .state("app.productBrands", {
            url: "/productBrands",
            controller: "ProductBrandsCtrl",
            templateUrl: "app/components/apps/productBrands/productBrands.html",
            onEnter: checkAuthentication,
            controllerAs: 'vm',
            title: 'Product Brands'
        })
        .state("app.productSpecies", {
            url: "/productSpecies",
            controller: "ProductSpeciesCtrl",
            templateUrl: "app/components/apps/productSpecies/productSpecies.html",
            onEnter: checkAuthentication,
            controllerAs: 'vm',
            title: 'Product Species'
        })
        .state("app.productColors", {
            url: "/productColors",
            controller: "ProductColorsCtrl",
            templateUrl: "app/components/apps/productColors/productColors.html",
            onEnter: checkAuthentication,
            controllerAs: 'vm',
            title: 'Product Colors'
        })
        .state("app.productSizes", {
            url: "/productSizes",
            controller: "ProductSizesCtrl",
            templateUrl: "app/components/apps/productSizes/productSizes.html",
            onEnter: checkAuthentication,
            controllerAs: 'vm',
            title: 'Product Sizes'
        })
        .state("app.productCategories", {
            url: "/productCategories",
            controller: "ProductCategoriesCtrl",
            templateUrl: "app/components/apps/productCategories/productCategories.html",
            onEnter: checkAuthentication,
            controllerAs: 'vm',
            title: 'Product Categories'
        })
        .state("app.productsFeatured", {
            url: "/productsFeatured",
            controller: "ProductsFeaturedCtrl",
            templateUrl: "app/components/apps/productsFeatured/productsFeatured.html",
            onEnter: checkAuthentication,
            controllerAs: 'vm',
            title: 'Products Featured'
        })
        .state("app.products", {
            url: "/products",
            controller: "ProductsCtrl",
            templateUrl: "app/components/apps/products/products.html",
            onEnter: checkAuthentication,
            controllerAs: 'vm',
            title: 'Products'
        })
        .state("callback", {
            url: '/callback',
            controller: 'CallbackCtrl',
            templateUrl: 'app/callback/callback.html',
            controllerAs: 'vm',
            title: 'Callback'
        })

        .state("app.settings", {
            url: '/settings',
            controller: 'SettingsCtrl',
            templateUrl: 'app/components/apps/settings/settings.html',
            controllerAs: 'vm',
            title: 'Settings'
        })

        .state("app.systemUsers", {
            url: '/systemUsers',
            controller: 'SystemUsersCtrl',
            templateUrl: 'app/components/apps/systemUsers/systemUsers.html',
            controllerAs: 'vm',
            title: 'System Users'
        })
        .state("app.stores", {
            url: '/stores',
            controller: 'StoresCtrl',
            templateUrl: 'app/components/apps/stores/stores.html',
            controllerAs: 'vm',
            title: 'Stores'
        })

        .state("wooSync", {
            url: '/wooSync',
            title: "Woo Sync",
            authenticate: false,
            resolve: {
                init: function(WooService) {
                    WooService.syncAll()
                }
            }
        })

        .state("oldData", {
            url: '/oldData',
            title: "Process Old Data",
            authenticate: false,
            resolve: {
                init: function(OldDataService) {
                    OldDataService.run()
                }
            }
        })

    ;
    // Initialization for the angular-auth0 library
    angularAuth0Provider.init({
        clientID: 'PILub0nXdeUTCAMWc7BzVaSyWpAH54jW',
        domain: 'wilco.auth0.com',
        responseType: 'token',
        audience: 'https://wilco.auth0.com/userinfo',
        redirectUri: window.location.protocol + '//' + window.location.host + '/callback',
        scope: REQUESTED_SCOPES
    });

    // setup to send tokens
    jwtOptionsProvider.config({
        tokenGetter: function() {
            return localStorage.getItem('access_token');
        },
        whiteListedDomains: ['localhost', 'wilco.auth0.com']
    });
    $httpProvider.interceptors.push('jwtInterceptor');
    $urlRouterProvider.otherwise('/dashboard');
    $locationProvider.hashPrefix('');
    $locationProvider.html5Mode(true);
}]);

//our angular auth check
function checkAuthentication($transition$) {
    var $state = $transition$.router.stateService;
    var auth = $transition$.injector().get('authService');
    if (!auth.isAuthenticated()) {
        return $state.target('login');
    }
}

app.run(['$rootScope', '$location', '$state', '$stateParams', 'authService', function ($rootScope, $location, $state, $stateParams, authService) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
    authService.handleAuthentication();

    $rootScope.$on('$stateChangeStart',
        function(event, toState, toParams, fromState, fromParams, options){

            console.log('I just tried to set loading status.');
        });

    $rootScope.$on('$stateChangeSuccess',
        function (event, toState, toParams, fromState, fromParams, options) {

            console.log('I just tried to remove loading status.');
        });


}]);
