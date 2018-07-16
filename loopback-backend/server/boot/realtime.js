/*var es = require('event-stream');
module.exports = function(app) {
 // var MyModel = app.models.MyModel;
  var user = app.models.User;
  user.createChangeStream(function(err, changes) {
    changes.pipe(es.stringify()).pipe(process.stdout);
  });
  user.create({
    name: 'Maria',
    lastName: 'gonzalez',
    phone: '111-111-111',
    email   : 'maria@gmail.com',
    password: 'maria',
    nameCompany: "CompanyMaria",
    status:1
  });
}*/