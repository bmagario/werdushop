'use strict';

/**
 * Module dependencies
 */
var zones = require('../controllers/zones.server.controller');

module.exports = function(app) {
  // zones Routes
	app.route('/api/zones').get(zones.list);
	app.route('/api/zones/get_name_zone/').get(zones.get_name_zone);
};
