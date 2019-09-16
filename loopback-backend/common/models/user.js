//var app = require('../../server/server');

module.exports = function (User) {
  var async = require('async')
  var loopback = require('loopback')
  var app;

  User.createUser = function (firstName, lastName, taxId, birthDate, email, password, roles, cb) {
    var Role = loopback.findModel('Role')
    var RoleMapping = loopback.findModel('RoleMapping')
    
    roles.forEach(function (roleId) {
      Role.findOne({
        where: {
          id: roleId
        }
      }, function (err, role) {
        if (err) return cb(err)
      })
    })
    User.create({
      'firstName': firstName,
      'lastName': lastName,
      'taxId': taxId,
      'birthDate': birthDate,
      'email': email,
      'password': password,
    }, function (err, user) {
      if (err) return cb(err)
      roles.forEach(function (roleId) {
        Role.findOne({
          where: {
            id: roleId
          }
        }, function (err, role) {
          if (err) return cb(err)

          role.principals.create({
            principalType: RoleMapping.USER,
            principalId: user.id
          }, function (err, principal) {
            if (err) return cb(err)
          })
        })
      })
      cb(null, user, 'application/json');
    });
  }

  User.remoteMethod('createUser', {
    accepts: [
      { arg: 'firstName', type: 'String' },
      { arg: 'lastName', type: 'String' },
      { arg: 'taxId', type: 'String' },
      { arg: 'birthDate', type: 'Date' },
      { arg: 'email', type: 'String' },
      { arg: 'password', type: 'String' },
      { arg: 'roles', type: '[String]' }
    ],
    returns: { arg: 'data', type: 'object', root: true },
    http: { path: '/createUser', verb: 'post', status: 201, errorStatus: 400 }
  })

  User.getRoles = function (id, cb) {
    var res = []
    var RoleMapping = loopback.findModel('RoleMapping')
    User.find({
      where: {
        'id': id
      }
    }, function (err, user) {
      if (err) cb(null, err)

      if (user.length > 0) {
        RoleMapping.find({
          where: {
            'principalId': user[0].id
          }
        }, function (err, mapping) {
          if (err) return cb(null, err)

          mapping.forEach(function (map) {
            RoleMapping.Role({
              "id": map.roleId
            }, function (role) {
              res.push(role.name)
            })
          })
          cb(null, res)
        })
      } else {
        cb(err, res)
      }
    })
  }

  User.remoteMethod('getRoles', {
    accepts: [
      { arg: 'id', type: 'String' },
    ],
    returns: { arg: 'data', type: 'object', root: true },
    http: { path: '/getRoles', verb: 'get', status: 200, errorStatus: 400 }
  })

  User.setGuard = function (id, timeStart, timeEnd, cb) {
    var res = []
    var Role = User.app.models.Role
    var Guard = User.app.models.Guard
    var RoleMapping = loopback.findModel('RoleMapping')
    var response = {}
    User.find({
      where: {
        'id': id
      }
    }, function (err, user) {
      if (err) cb(null, err)

      if (user.length > 0) {
        Guard.create({
          'timeStart': timeStart,
          'timeEnd': timeEnd,
          'redactorId': id
        }, function (err, guard) {
          if (err) { cb(err, null) }
          Role.find({
            where: {
              'name': 'Guardia'
            }
          }, function (err, roles) {
            if (err) { cb(err, null) }
            if (roles.length > 0) {
              roles[0].principals.create({
                principalType: RoleMapping.USER,
                principalId: user[0].id
              });
            }
            response.message = 'Ok'
            cb(null, guard)
          })
        })
      } else {
        cb(err, res)
      }
    })
  }

  User.search = function search(str, cb) {
    var result = []
    var response = []
    var response1 = []
    var aux = {}
    str = str || ''
    User.find({
       
       include: {
       relation: 'notices',
        scope: { // further filter the owner object
          fields: ['title','slug','id','dateCreated','status'], // only show two field      }
        }
       }
      },function (err, redactor) {
       // console.log(redactor);
      if (err) {
        cb(err, null)
      } else {


        if (redactor.length > 0) {

          result = redactor.filter(busquedaStr, str.toUpperCase())
          async.each(result, function (item, callback) {
            

            for (var i = 0; i < item.__data.notices.length; i++) {

              redactor = {};
              aux = {};

              aux.redactor = redactor;

              aux.title = item.__data.notices[i].title;
              aux.slug = item.__data.notices[i].slug;
              aux.id = item.__data.notices[i].id;
              aux.redactorId = item.__data.notices[i].redactorId;
              aux.dateCreated = item.__data.notices[i].dateCreated;
              aux.status = item.__data.notices[i].status;

              redactor.firstName = item.firstName;
              redactor.lastName = item.lastName;
              redactor.id = item.id;
              response.push(aux);

            }
        
            callback();
          }, function () {
            cb(null, response)
          })
        } else {
          cb(null, response)
        }
      }
    })
  }


   /**
   * Return all roles that a user has
   * @param id
   * @param cb
   */
  User.getRoles = function getRoles(id, cb) {
    var res = []
    var RoleMapping = User.app.models.RoleMapping;
    var Role = User.app.models.Role;
    var error;
    User.findOne({
      where: {
        id: id
      },
      limit: 1
    }, function (err, user) {
      if (err)
        cb(null, err)
      else {
        if (user) {
          RoleMapping.find({
            where: {
              'principalId': user.id
            }
          }, function (err, mapping) {
            if (err) return cb(null, err)
            else {
            //  console.log(mapping)
              async.each(mapping, function (map, callback) {
                Role.findOne({
                  where: { "id": map.roleId },
                  limit: 1
                }, function (err, role) {
                  res.push(role.name)
                  callback()
                })
              }, function (err) {
                cb(null, res)
              })
            }
          })
        } else {
          cb(err, res)
        }
      }
    })
  };




  User.getRole = function gerRole(id, cb) {
    var Role = User.app.models.Role;
    var RoleMapping = User.app.models.RoleMapping;
    var aux = 0;
    var error;

    Role.getRoles({
      principalType: RoleMapping.USER,
      principalId  : id
    }, function(err, maps) {
      if (err)
        cb(err, null);
      async.each(maps, function(item, callback) {
        if (item !== '$authenticated' && item !== '$everyone')
          aux = item;
        else
          aux = 0;
        callback();
      }, function(err) {
        if (aux !== 0) {
          Role.findOne({
            where:{
              id:aux
            },
            limit: 1
          }, function(err, role) {
            if (err)
              cb(err, null);
            cb(null, role);
          });
        } else {
          error = new Error('Not found');
          error.statusCode = 404;
          cb(error, null);
        }
      });
    });
  };

  User.getCurrent = function getCurrent(cb) {
    var userId = loopback.request.getUserId();
    cb({id:userId})
  }

  function busquedaStr(item) {
    return item.firstName.toUpperCase().includes(this) || item.lastName.toUpperCase().includes(this)
  }


   User.remoteMethod(
    'getCurrent', {
      http: {
        path: '/getCurrent',
        verb: 'get'
      },
      returns: {
        type: 'object',
        root: true
      },
      description: 'Get Current user'
  });

  User.remoteMethod('setGuard', {
    accepts: [
      { arg: 'id', type: 'String' },
      { arg: 'timeStart', type: 'Date', required: true },
      { arg: 'timeEnd', type: 'Date', required: true },
    ],
    returns: { arg: 'data', type: 'object', root: true },
    http: { path: '/:id/setGuard', verb: 'post', status: 200, errorStatus: 400 }
  })

  User.remoteMethod(
    'search',
    {
      accepts: [{
        arg: 'str',
        type: 'string'
      }],
      http: { path: '/search', verb: 'get' },
      returns: { arg: 'response', type: 'array', root: true },
      description: 'Get search result'
    }
  )


  User.remoteMethod(
    'getRole', {
      accepts:[{
        arg: 'id',
        type: 'number',
        required: true
      }],
      http: {
        path: '/:id/role',
        verb: 'get'
      },
      returns: {
        type: 'Role',
        root: true
      },
      description: 'Get a role of the user'
  });


  
  User.remoteMethod(
    'getRoles', {
      accepts: [
        {
          arg: 'id',
          type: 'number',
          required: true,
          http: { source: 'path' }
        }
      ],
      http: {
        path: '/:id/roles',
        verb: 'get'
      },
      returns: {
        arg: 'roles',
        type: 'array'
      },
      description: 'Return all roles that a user has'
    }
  );



};
