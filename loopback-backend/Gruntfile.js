module.exports = function(grunt) {
  grunt.initConfig({
    'loopback_auto': {
      /*
      'db_autoupdatecorp': {
        options: {
          dataSource: 'mysql_corp',
          app: './server/server',
          config: './server/model-config',
          method: 'autoupdate'
        }
      },
      'db_autoupdatesecurity': {
        options: {
          dataSource: 'mysql_security',
          app: './server/server',
          config: './server/model-config',
          method: 'autoupdate'
        }
      },*/
      'db_automigratesecurity': {
        options: {
          dataSource: 'mysql_security',
          app: './server/server',
          config: './server/model-config',
          method: 'automigrate'
        }
      },
      'db_automigratecorp': {
        options: {
          dataSource: 'mysql_corp',
          app: './server/server',
          config: './server/model-config',
          method: 'automigrate'
        }
      }
      
    }
  });
  // Load the plugin
  grunt.loadNpmTasks('grunt-loopback-auto');
  grunt.registerTask('default', ['loopback_auto']);
};
