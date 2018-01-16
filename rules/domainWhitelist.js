function (user, context, callback) {
    var whitelist = [
        'esgroupllc.com',
        'ruralite.org',
        'websupport.expert',
        'hathaway.xyz'
    ]; //authorized domains
    var userHasAccess = whitelist.some(
        function (domain) {
            var emailSplit = user.email.split('@');
            return emailSplit[emailSplit.length - 1].toLowerCase() === domain;
        });

    if (!userHasAccess) {
        return callback(new UnauthorizedError('Access denied.'));
    }

    return callback(null, user, context);
}