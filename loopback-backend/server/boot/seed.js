module.exports = function (app) {
  // Do not seed if not a local environment
  if (process.env.NODE_ENV !== 'offline')
    return;
  var User = app.models.User;
  var Role = app.models.Role;
  var RoleMapping = app.models.RoleMapping;

  User.create([{
    email: 'deadline@deadlinestudio.co',
    username: 'deadline',
    password: 'deadline',
    firstName: 'Deadline',
    lastName: 'Studio',
    taxId: 'J-1242356346',
    birthDate: '2000-01-01'
  }, {
    email: 'fernando@deadlinestudio.co',
    username: 'fernando',
    password: 'fernando',
    firstName: 'Fernando',
    lastName: 'Espinoza',
    taxId: 'J-1242354356',
    birthDate: '2000-01-01'
  }, {
    email: 'daniel@correo.co',
    username: 'daniel',
    password: 'daniel',
    firstName: 'Daniel',
    lastName: 'Gazcon',
    taxId: 'J-1234567',
    birthDate: '2000-01-01'
  }], function (err, users) {
    //
    // Create all roles
    //
    Role.create(
      [
        {name: 'Administrador'},
        {name: 'Super Administrador'},
        {name: 'Redactor'},
        {name: 'Coordinador'},
        {name: 'Guardia'},
        {name: 'Moderador de Contenido'},
        {name: 'Moderador de Audiovisuales'},
        {name: 'Lector'}
      ], function (err, roles) {

        //
        // Make Fernando Coordinator
        //
        roles[3].principals.create({
          principalType : RoleMapping.USER,
          principalId   : users[1].id
        });
        //
        // Make Gustavo Redactor
        //
        roles[0].principals.create({
          principalType : RoleMapping.USER,
          principalId   : users[2].id
        });
        //
        // Make Deadline administrator
        //
        roles[0].principals.create({
          principalType: RoleMapping.USER,
          principalId  : users[0].id
        });
    });
  });
};
