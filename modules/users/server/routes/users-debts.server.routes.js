'use strict';

/**
 * Module dependencies.
 */
var adminPolicy = require('../policies/users-debts.server.policy'),
  users = require('../controllers/payment/users-debts.server.controller');

module.exports = function (app) {
  // Users collection routes
  app.route('/api/users_debts')
    .get(adminPolicy.isAllowed, users.list_users_debts);

  // Single user routes
  app.route('/api/users_debts/:id_user')
    .get(adminPolicy.isAllowed, users.read_debt);

  app.route('/api/users_debts/load_payment')
    .post(adminPolicy.isAllowed, users.load_payment);

  // Finish by binding the user middleware
  app.param('id_user', users.userDebtsByID);
};
