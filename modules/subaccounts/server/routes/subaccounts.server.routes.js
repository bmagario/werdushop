'use strict';

/**
 * Module dependencies
 */
var subaccountsPolicy = require('../policies/subaccounts.server.policy'),
  subaccounts = require('../controllers/subaccounts.server.controller');

module.exports = function(app) {
  // Subaccounts Routes
  app.route('/api/subaccounts').all(subaccountsPolicy.isAllowed)
    .get(subaccounts.list)
    .post(subaccounts.create);

  app.route('/api/subaccounts/get_subaccounts_users_providers').all(subaccountsPolicy.isAllowed)
    .get(subaccounts.get_subaccounts_users_providers);

  app.route('/api/subaccounts/:id_subaccount').all(subaccountsPolicy.isAllowed)
    .get(subaccounts.read)
    .put(subaccounts.update)
    .delete(subaccounts.delete);

  // Finish by binding the Subaccounts middleware
  app.param('id_subaccount', subaccounts.subaccountByID);
};
