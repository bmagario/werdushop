'use strict';

/**
 * Module dependencies
 */
var payment_methods = require('../controllers/payment_methods.server.controller');

module.exports = function(app) {
  // payment_methods Routes
  app.route('/api/payment_methods').get(payment_methods.list);
};
