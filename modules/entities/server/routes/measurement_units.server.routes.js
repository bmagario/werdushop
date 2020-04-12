'use strict';

/**
 * Module dependencies
 */
var measurement_units = require('../controllers/measurement_units.server.controller');

module.exports = function(app) {
  // MeasurementUnits Routes
  app.route('/api/measurement_units')
    .get(measurement_units.list);
};