module.exports = function (app) {
  var path = require('path');
  var nodeEnv = process.env.NODE_ENV ? process.env.NODE_ENV + '.' : '';
  var models = require(path.resolve(__dirname, '../model-config.' + nodeEnv + 'json'));
  var datasources = require(path.resolve(__dirname, '../datasources.' + nodeEnv + 'json'));

  function autoUpdateAll() {
    Object.keys(models).forEach(function (key) {
      if (typeof models[key].dataSource != 'undefined') {
        if (typeof datasources[models[key].dataSource] != 'undefined') {
          app.dataSources[models[key].dataSource].autoupdate(key, function (err) {
            if (err)
              throw err;
            console.log('Model ' + key + ' updated');
          });
        }
      }
    });
  }
 // autoUpdateAll();
};