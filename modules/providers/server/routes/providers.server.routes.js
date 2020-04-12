'use strict';

/**
 * Module dependencies
 */
var providersPolicy = require('../policies/providers.server.policy'),
  providers = require('../controllers/providers.server.controller');

module.exports = function(app) {
  // Providers Routes
  app.route('/api/providers').all(providersPolicy.isAllowed)
    .get(providers.list)
    .post(providers.create);

  app.route('/api/providers/:id_provider').all(providersPolicy.isAllowed)
    .get(providers.read)
    .put(providers.update)
    .delete(providers.delete);

  // Providers Cta. Corriente Routes
  app.route('/api/providers_debts').all(providersPolicy.isAllowed)
    .get(providers.list_providers_debts);

  app.route('/api/providers_debts/:id_providerDebt').all(providersPolicy.isAllowed)
    .get(providers.read_debt);

  app.route('/api/providers_debts/load_payment').all(providersPolicy.isAllowed)
    .post(providers.load_payment);

  // Finish by binding the Provider middleware
  app.param('id_provider', providers.providerByID);
  app.param('id_providerDebt', providers.providerDebtsByID);
};
