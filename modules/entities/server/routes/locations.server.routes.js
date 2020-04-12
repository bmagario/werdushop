'use strict';

/**
 * Module dependencies
 */
var locations = require('../controllers/locations.server.controller');

module.exports = function(app) {
  // Locations Routes
  app.route('/api/locations').get(locations.list);
  app.route('/api/locations/get_name_location/').get(locations.get_name_location);
};