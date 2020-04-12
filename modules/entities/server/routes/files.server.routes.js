'use strict';

/**
 * Module dependencies
 */
var files = require('../controllers/files.server.controller');

module.exports = function(app) {
  // files Routes
  app.route('/api/download_deliveries').post(files.download_deliveries);
  app.route('/api/download_deliveries_panel').post(files.download_deliveries_panel);
};
