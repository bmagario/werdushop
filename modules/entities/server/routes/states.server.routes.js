'use strict';

/**
 * Module dependencies
 */
var states = require('../controllers/states.server.controller');

module.exports = function(app) {
  // States Routes
  app.route('/api/states').get(states.list);
};