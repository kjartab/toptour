var kue = require('kue')
 , queue = kue.createQueue();

queue.process('email', function(job, done){
  email(job.data.to, done);
});

function email(address, done) {
  if(!isValidEmail(address)) {
    //done('invalid to address') is possible but discouraged
    return done(new Error('invalid to address'));
  }
  // email send stuff...
  done();
}
