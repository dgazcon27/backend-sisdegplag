module.exports = function(app) {

    function loadRoles() {
        var roles = ['Coordinador', 'Administrador', 'Super Administrador', 'Lector'];
        var Role = app.models.Role;
        var RoleMapping = app.models.RoleMapping;

        roles.forEach(function (rol) {
            Role.findOrCreate({
                where:{
                    name : rol
                }
            },{
                name: rol
            },function (err, role, created) {
                if (err) throw err;
            })
        })
    }

    //loadRoles();

}
