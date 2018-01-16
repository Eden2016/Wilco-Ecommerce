function (user, context, callback) {

    var adminAccess = [
        'mirandab@esgroupllc.com',
        'debbies@esgroupllc.com',
        'paulr@esgroupllc.com',
        'alexh@ruralite.org',
        'corey@websupport.expert',
        'charlies@ruralite.org'
    ];
    var writeAccess = [
        'markg@esgroupllc.com',
        'daveb@esgroupllc.com',
        'michelleo@esgroupllc.com',
        'nadyak@esgroupllc.com',
        'patd@esgroupllc.com',
        'fredys@esgroupllc.com',
        'bradg@esgroupllc.com',
        'karib@esgroupllc.com'
    ];
    var readAccess = [
        'michaels@ruralite.org',
        'wendyk@rurlite.org',
        'alex@hathaway.xyz'
    ];

    if (adminAccess.indexOf(user.email) !== -1) {
        context.accessToken.scope = ['openid', 'profile', 'read:records', 'write:records', 'delete:records', 'admin:users'];
    }
    else if(writeAccess.indexOf(user.email) !== -1){
        context.accessToken.scope = ['openid', 'profile', 'read:records', 'write:records'];
    }
    else if(readAccess.indexOf(user.email) !== -1){
        context.accessToken.scope = ['openid', 'profile', 'read:records'];
    }
    else{
        context.accessToken.scope = ['openid', 'profile', 'read:records'];
    }

    callback(null, user, context);
}