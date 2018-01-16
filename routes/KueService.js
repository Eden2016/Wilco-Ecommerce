var kue = require('kue');
var queue = kue.createQueue();
var async = require('async');
var request = require('request');
var queued_jobs = [];
var active_jobs = [];

var woo = require('./woo');

// create job
exports.createJob = function(req, callback) {
    var job = queue.create('job', {
        title: 'job ran at ' + Date.now(),
        query_url: req.url
    }).save( function(err){
        if( !err ) console.log( callback.id );
    });
    job.on('complete', function() {
        callback();
    }).on('failed', function(){
        //callback({error: true});
    });
};

// create and process job immediately
exports.runJob = function(req, callback) {
    var job = queue.create('job', {
        title: 'job ran at ' + Date.now(),
        query_url: req.url
    }).save( function(err){
        if( !err ) console.log( callback.id );
    });
    job.on('complete', function() {
        callback();
    }).on('failed', function(){
        //callback({error: true});
    });
    queue.process(job.type, function(job, done) {
        done();
    });
};

exports.runWoo = function(product, priority="normal", callback, cb) {
    var jobType = "woo-full";
    if (product.master_sku !== null) {
        jobType = "woo-full-"+product.master_sku;
    }
    var job = queue.create(jobType, {
        title: 'Woo sync for ' + product.item_number,
        product: product
    }).priority(priority).save( function(err) {
        if (!err) {
            console.log("Done "+product.item_number);
            cb();
        }
    });
    job.on('complete', function() {
        console.log("job done");
    }).on('failed', function() {

    });
    // queue.process(job.type, 5, function(job, done) {
    //     callback(job, done);
    // });
};

exports.runWooLite = function(product, priority="normal", callback, cb) {
    var job = queue.create('woo-lite', {
        title: 'Woo sync for ' + product.item_number,
        product: product
    }).priority(priority).save( function(err) {
        if (!err) {
            console.log("Done "+product.item_number);
            cb();
        }
    });
    job.on('complete', function() {
        console.log("job done");
    }).on('failed', function() {

    });
    // queue.process(job.type, 5, function(job, done) {
    //     callback(job, done);
    // });
};

exports.runWooSingle = function(product, callback) {
    var job = queue.create('woo-single', {
        title: 'Woo sync for ' + product.item_number,
        product: product
    }).priority("high").save( function(err) {
        if (!err) {
            console.log("Done "+product.item_number);
        }
    });
    job.on('complete', function() {
        console.log("job done");
    }).on('failed', function() {

    });
    queue.process(job.type, 1, function(job, done) {
        callback(job, done);
    });
};

exports.runWooMaster = function(product, callback) {
    var job = queue.create('woo-master', {
        title: 'Woo sync for ' + product.item_number,
        product: product
    }).save( function(err) {
        if (!err) {
            console.log("Done "+product.item_number);
        }
    });
    job.on('complete', function() {
        console.log("job done");
    }).on('failed', function() {

    });
    // queue.process(job.type, 1, function(job, done) {
    //     callback(job, done);
    // });
};

exports.runWooMasterQueue = function() {
    queue.process('woo-master', 5, function(job, done) {
        woo.processQueue(job, done);
    });
}

exports.runWooQueue = function(lite=false) {
    this.wooMax = 50;
    this.wooLiteMax = 50;
    this.otherwiseMax = 40;
    this.queuedJobs = [];
    this.activeJobs = [];
    this.activeWooFull = 0;

    var self = this;

    async.waterfall([
        function(cb) {
            queue.inactive(function(err,ids) {
                async.forEachSeries(ids, function(id, cb2) {
                    kue.Job.get(id, function(err, job) {
                        if (typeof self.queuedJobs[job.type] === 'undefined') {
                            self.queuedJobs[job.type] = 1;
                        } else {
                            self.queuedJobs[job.type] = self.queuedJobs[job.type] + 1;
                        }
                        cb2();
                    });
                }, function() { cb(); });
            });
        },
        function (cb) {
            queue.active(function(err,ids) {
                var removedCount = 0;
                async.forEachSeries(ids, function(id, cb2) {
                    kue.Job.get(id, function(err, job) {
                        if((Date.now() - job.updated_at) > 30000) {
                            job.inactive();
                            removedCount++;
                            self.queuedJobs[job.type] = self.queuedJobs[job.type] + 1;
                        } else {
                            if (self.activeJobs[job.type] == null) {
                                self.activeJobs[job.type] = 1;
                                if (self.activeJobs['woo-full'] == null) {
                                    self.activeJobs['woo-full'] = 1;
                                } else {
                                    self.activeJobs['woo-full'] = self.activeJobs['woo-full'] + 1;
                                }
                            } else {
                                self.activeJobs[job.type] = self.activeJobs[job.type] + 1;
                                if (job.type.includes("woo-full")) {
                                    self.activeJobs['woo-full'] = self.activeJobs['woo-full'] + 1;
                                }
                            }
                        }
                        cb2();
                    });
                }, function() { 
                    if (removedCount > 0) {
                        sl("*WooQueueManager* Found active jobs stuck for over 30 seconds", [{color:'#ff0000',text:'Set '+removedCount+' jobs back to inactive'}]);
                    }
                    cb() 
                });
            });
        }
    ], function() {
        var wooFull = self.queuedJobs['woo-full'];
        delete self.queuedJobs['woo-full'];

        if (typeof self.activeJobs['woo-full'] == 'undefined') {
            self.activeJobs['woo-full'] = 0;
        }

        console.log("**********************************");
        console.log("**********************************");
        console.log("**********************************");
        console.log("activeJobs:");
        console.log(self.activeJobs);

        for (var type in self.queuedJobs) {
            if (typeof self.activeJobs[type] == 'undefined') {
                self.activeJobs[type] = 0;
            }

            if (type.includes("woo-full-")) { // full woo
                if (self.activeJobs['woo-full'] < self.wooMax && self.activeJobs[type] < 1) {
                    console.log("self.activeJobs['woo-full'] = "+self.activeJobs['woo-full']);
                    console.log("self.activeJobs[type] = "+self.activeJobs[type]);
                    // it's one of our master SKUs
                    console.log("Fire 1 of: "+type); 
                    self.activeJobs['woo-full'] = self.activeJobs['woo-full'] + 1;
                    self.activeJobs[type] = self.activeJobs[type] + 1;
                    queue.process(type, 1, function(job, done) {
                        woo.processQueue(job, done);
                    });
                }
            } else if (type == "woo-lite") { // lite woo
                if (self.activeJobs[type] < self.wooLiteMax) {
                    // fire Woo queue
                    console.log("fire "+type+" @ "+(self.wooLiteMax-self.activeJobs[type]));
                    queue.process(type, (self.wooLiteMax-self.activeJobs[type]), function(job, done) {
                        woo.processQueue(job, done, true);
                    });
                }
            } else { // woo-master, or other stuff
                if (self.activeJobs[type] < self.otherwiseMax) {
                    // fire Woo queue
                    console.log("fire "+type+" @ "+(self.otherwiseMax-self.activeJobs[type]));
                    queue.process(type, (self.otherwiseMax-self.activeJobs[type]), function(job, done) {
                        woo.processQueue(job, done);
                    });
                }
            }
        }

        if (typeof wooFull !== "undefined") {
            if (self.activeJobs['woo-full'] < self.wooMax) {
                console.log("*self.activeJobs['woo-full'] = "+self.activeJobs['woo-full']);
                // its a simple product
                var numFireOff = self.wooMax - self.activeJobs['woo-full'];
                if (numFireOff > wooFull) {
                    numFireOff = wooFull;
                }
                if (numFireOff > 0) {
                    // fire!
                    console.log("Fire "+numFireOff+" of: "+"woo-full");
                    queue.process("woo-full", numFireOff, function(job, done) {
                        woo.processQueue(job, done);
                    });
                    self.activeJobs['woo-full'] = self.activeJobs['woo-full'] + numFireOff;
                }
            }
        }

        if (typeof wooFull == "undefined") { wooFull = 0; }
        if (typeof self.activeJobs['woo-lite'] == "undefined") { self.activeJobs['woo-lite'] = 0 }
        if (typeof self.queuedJobs['woo-lite'] == "undefined") { self.queuedJobs['woo-lite'] = 0 }

        if (self.activeJobs['woo-full']>0 || self.activeJobs['woo-lite']>0) {
            sl("*WooQueueManager:* Queue stats", [
                { text: "WooFull: "+self.activeJobs['woo-full']+" active out of "+wooFull+" total jobs" },
                { text: "WooLite: "+self.activeJobs['woo-lite']+" active out of "+self.queuedJobs['woo-lite']+" total jobs" },
            ]);
        }
    });
}

exports.cleanKue = function() {
    var count = 0;
    queue.inactive( function( err, ids ) {
        ids.forEach( function( id ) {
          kue.Job.get( id, function( err, job ) {
            // Your application should check if job is a stuck one
            if (typeof job !== "undefined") job.remove();
            count++;
          });
        });
      });

      queue.active( function( err, ids ) {
        ids.forEach( function( id ) {
          kue.Job.get( id, function( err, job ) {
            // Your application should check if job is a stuck one
            if (typeof job !== "undefined") job.remove();
            count++;
          });
        });
      });

    sl("*WooQueueManager:* Cleaned "+count+" inactive and active jobs from Kue");
}

exports.cleanComplete = function () {
    var count = 0;
    queue.complete(function(err, ids) {
        ids.forEach(function(id) {
            kue.Job.get(id, function(err, job) {
                if (typeof job !== "undefined") job.remove();
                count++;
            });
        });
    });

    sl("*WooQueueManager:* Cleaned "+count+" completed jobs from Kue");

}


exports.queueJob = function(req) {
    var job = createJob(req);
    queued_jobs.push(job);
    console.log("Num jobs queued*: " + queued_jobs.length);
};

exports.runNextQueuedJob = function() {
    var job = queued_jobs.shift();
    queue.process(job.type, function(job, done) {
        done();
    });
};
exports.runAllQueuedJobs = function() {
    while (queued_jobs.length() > 0) {
        this.runNextQueuedJob();
    }
};

exports.jobsRemaining = function() {
    return queued_jobs.length();
};

function sl(message, attachments=[]) {
    var data = {
        text:message,
        mrkdwn: true,
        attachments: attachments
    }

    var options = {
        url: 'https://hooks.slack.com/services/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',
        method: 'POST',
        body: JSON.stringify(data)
    }


    request(options, (err,res,body) => {});

}