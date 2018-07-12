'use strict';

module.exports = function(app) {
  /*
   * The `app` object provides access to a variety of LoopBack resources such as
   * models (e.g. `app.models.YourModelName`) or data sources (e.g.
   * `app.datasources.YourDataSource`). See
   * http://docs.strongloop.com/display/public/LB/Working+with+LoopBack+objects
   * for more info.
   */

    function loadUsers() {
        var User = app.models.user;
        var Role = app.models.Role;
        var RoleMapping = app.models.RoleMapping;
        var ACL = app.models.ACL
        User.findOrCreate({
            where:{
                username: 'deadline'
            }
        },{
            email: 'deadline@deadlinestudio.co',
            username: 'deadline',
            password: 'deadline',
            firstName: 'Deadline',
            lastName: 'Studio',
            taxId: 'J-1242356346',
            birthDate: '2000-01-01',
        },function (err, user, created) {
            if (err) {return console.log(err)}

            if (created) {
                console.log('Created user:', user);
            }

            Role.findOrCreate({
                where: {
                    name: 'Administrador'
                }
            },{
                name: 'Administrador'
            }, function(err, role, created) {
                if (err) {return console.log(err)}
                role.principals({
                    where:{
                        principalId: user.id
                    }
                }, function (err, principal) {
                    if (err) {return console.log(err)}

                    if (principal.length == 0) {
                        role.principals.create({
                            principalType: RoleMapping.USER,
                            principalId: user.id
                        }, function (err, principal) {
                            if (err) {return console.log(err)}
                            console.log('Created principal:', principal);
                        })
                    }
                })
            })
        })
    }

    //loadUsers();
};
