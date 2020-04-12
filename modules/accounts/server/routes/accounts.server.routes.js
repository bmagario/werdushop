'use strict';

/**
 * Module dependencies
 */
var cuentasPolicy = require('../policies/accounts.server.policy'),
  accounts = require('../controllers/accounts.server.controller');

module.exports = function(app) {
  // Cuentas Routes
  app.route('/api/accounts').all(cuentasPolicy.isAllowed)
    .get(accounts.list)
    .post(accounts.create);

  app.route('/api/accounts/:id_account').all(cuentasPolicy.isAllowed)
    .get(accounts.read)
    .put(accounts.update)
    .delete(accounts.delete);

  // Finish by binding the Cuenta middleware
  app.param('id_account', accounts.cuentaByID);
};
