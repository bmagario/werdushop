'use strict';

/**
 * Module dependencies
 */
var cashPolicy = require('../policies/cash.server.policy'),
  cash = require('../controllers/cash.server.controller');

module.exports = function(app) {
  // Cash Routes
  app.route('/api/cash/get_cash').all(cashPolicy.isAllowed)
    .get(cash.get_cash);

  app.route('/api/cash/get_cash_history').all(cashPolicy.isAllowed)
    .get(cash.get_cash_history);

  app.route('/api/cash/load_subaccount').all(cashPolicy.isAllowed)
    .post(cash.load_subaccount);

  app.route('/api/cash/load_start_cash_count').all(cashPolicy.isAllowed)
    .post(cash.load_start_cash_count);

  app.route('/api/cash/load_final_cash_count').all(cashPolicy.isAllowed)
    .post(cash.load_final_cash_count);
};
