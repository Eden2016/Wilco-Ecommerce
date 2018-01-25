const SparkPost = require('sparkpost');
const client = new SparkPost('59cd4e623793e90fd3c1b9acf91aa22591bb42f6');

exports.send_mail = function(req, res) {
    var send_from = req.body.send_from;
    var send_to = req.body.send_to;
    var send_body = req.body.send_body;

    var html_body = '';
    Object.keys(send_body).forEach(function(key) {
        html_body += '<p><b>' + key + ':</b> ' + send_body[key] + '</p>'
    });
    client.transmissions
        .send({
            // options: {
            //     sandbox: true
            // },
            content: {
                from: send_from,
                subject: 'Customer Record Request',
                html:'<html><body>' + html_body + '</body></html>'
            },
            recipients: [
                {address: send_to}
            ]
        })
        .then(data => {
            console.log('Mail successfully sent');
            console.log(data);
            return res.json(['Mail successfully sent']);
        })
        .catch(err => {
            console.log('Mail send failure');
            console.log(err);
            return res.json(['Mail send failure']);
        })
    ;
};
