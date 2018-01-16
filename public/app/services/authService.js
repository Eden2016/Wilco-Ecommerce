'use strict';

app.service('authService', authService);

authService.$inject = ['$state', 'angularAuth0', '$timeout', '$rootScope'];

function authService($state, angularAuth0, $timeout, $rootScope) {

    var options = {
        container: 'sign-in-form',
        theme: {
            logo: "",
            primaryColor: "#1e77b2"
        },
        primaryColor: "#1e77b2"
    }

    var lock = new Auth0Lock(
        'PILub0nXdeUTCAMWc7BzVaSyWpAH54jW',
        'wilco.auth0.com',
        options
    );
    

    function login() {
        

        
    }

    function handleAuthentication() {
        lock.on("authenticated", function(authResult) {
            // Use the token in authResult to getUserInfo() and save it to localStorage
            lock.getUserInfo(authResult.accessToken, function(error, profile) {
                if (error) {
                    // Handle error
                    console.log(error);
                    return;
                }

                console.log(authResult);

                setSession(authResult);
                $state.go('dashboard');
            
                // document.getElementById('nick').textContent = profile.nickname;
            
                // localStorage.setItem('accessToken', authResult.accessToken);
                // localStorage.setItem('profile', JSON.stringify(profile));
            });
        });
        // angularAuth0.parseHash(function (err, authResult) {
        //     if (authResult && authResult.accessToken && authResult.idToken) {
        //         setSession(authResult);
        //         $state.go('dashboard');
        //     } else if (err) {
        //         $timeout(function () {
        //             $state.go('dashboard');
        //         });
        //         console.log(err);
        //     }
        // });
    }

    function setSession(authResult) {
        // Set the time that the access token will expire at
        let expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
        localStorage.setItem('access_token', authResult.accessToken);
        localStorage.setItem('id_token', authResult.idToken);
        localStorage.setItem('expires_at', expiresAt);

        // Set scopes
        var scopes = authResult.scope || REQUESTED_SCOPES || '';
        localStorage.setItem('scopes', JSON.stringify(scopes));
    }

    function logout() {
        // Remove tokens and expiry time from localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('id_token');
        localStorage.removeItem('expires_at');
        localStorage.removeItem('esg_user_profile');
    }

    function isAuthenticated() {
        // Check whether the current time is past the
        // access token's expiry time
        let expiresAt = JSON.parse(localStorage.getItem('expires_at'));
        return new Date().getTime() < expiresAt;
    }

    var userProfile;

    function getProfile(cb) {
        var accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
            console.log(new Error('Access token must exist to fetch profile'));
        }
        angularAuth0.client.userInfo(accessToken, function(err, profile) {
            if (profile) {
                setRealUserProfile(profile);
                setUserProfile(profile);
            }
            cb(err, profile);
        });
    }

    function setUserProfile(profile) {
        userProfile = profile;
    }

    function getCachedProfile() {
        return userProfile;
    }

    function userHasScopes(scopes) {
        var grantedScopes = JSON.parse(localStorage.getItem('scopes')).split(' ');
        for (var i = 0; i < scopes.length; i++) {
            if (grantedScopes.indexOf(scopes[i]) < 0) {
                return false;
            }
        }
        return true;
    }

    function setRealUserProfile(profile) {
        localStorage.setItem('esg_user_profile',JSON.stringify(profile));
        $rootScope.esg_user_profile = profile;
    }
    function getRealUserProfile() {
        if(localStorage.getItem('esg_user_profile')){
            return JSON.parse(localStorage.getItem('esg_user_profile'));
        }
        else{
            getProfile(function(err, profile) {
                localStorage.setItem('esg_user_profile',JSON.stringify(profile));
                $rootScope.esg_user_profile = profile;
                return profile;
            });
        }
    }

    return {
        login: login,
        handleAuthentication: handleAuthentication,
        logout: logout,
        isAuthenticated: isAuthenticated,
        getProfile: getProfile,
        setUserProfile: setUserProfile,
        getCachedProfile: getCachedProfile,
        userHasScopes: userHasScopes,
        getRealUserProfile: getRealUserProfile,
        lock: lock
    }
}