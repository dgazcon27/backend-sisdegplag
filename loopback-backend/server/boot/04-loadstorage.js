'use strict';

module.exports = function (app) {
  /*
   * The `app` object provides access to a variety of LoopBack resources such as
   * models (e.g. `app.models.YourModelName`) or data sources (e.g.
   * `app.datasources.YourDataSource`). See
   * http://docs.strongloop.com/display/public/LB/Working+with+LoopBack+objects
   * for more info.
   */

  var async = require('async');
  function checkStorage() {
    var Container = app.models.Container;
    var documents = false;
    Container.getContainers(function (err, containers) {
      if (err) {
        cb(err)
      } else {
        async.each(containers, function (folder, callback) {
          if (folder.name === 'documents') {
            documents = true
          }
          callback()
        }, function (err) {
          if (!documents) {
            Container.createContainer({
              name: 'documents'
            }, function (err, container) {
              console.log('Documents folder created');
            })
          }
        })
      }
    })
  }

  checkStorage()
};
