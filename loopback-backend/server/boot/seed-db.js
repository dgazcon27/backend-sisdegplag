module.exports = function (app) {
  // Do not seed if not a local environment
  if (process.env.NODE_ENV !== 'offline')
    return;
  var User = app.models.User;
  var Role = app.models.Role;
  var RoleMapping = app.models.RoleMapping;

  User.create([{
    email: 'superuser@sisplag.co',
    username: 'superuser',
    password: 'superuser',
    firstName: 'Super',
    lastName: 'User',
    taxId: 'J-1242356346',
    birthDate: '2000-01-01'
  }, {
    email: 'daniel@sisplag.com',
    username: 'daniel',
    password: 'daniel',
    firstName: 'Daniel',
    lastName: 'Gazcón',
    taxId: 'J-225565186',
    birthDate: '2000-01-01'
  }], function (err, users) {
    //
    // Create all roles
    //
    Role.create(
      [
        {name: 'Administrador'},
        {name: 'Super Administrador'},
        {name: 'Coordinador'},
        {name: 'Lector'}
      ], function (err, roles) {

        //
        //
        roles[3].principals.create({
          principalType : RoleMapping.USER,
          principalId   : users[1].id
        });
        //
        //
        roles[0].principals.create({
          principalType: RoleMapping.USER,
          principalId  : users[0].id
        });
    });
  });
};
