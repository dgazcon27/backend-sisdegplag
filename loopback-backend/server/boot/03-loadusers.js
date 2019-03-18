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
                username: 'dgazcon'
            }
        },{
            email: 'daniel.gazcon27@gmail.com',
            username: 'dgazcon',
            password: 'dgazcon27',
            firstName: 'Daniel',
            lastName: 'Gazcon',
            taxId: 'V-22556518',
            birthDate: '1992-07-10',
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
