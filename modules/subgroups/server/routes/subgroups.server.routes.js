'use strict';

/**
 * Module dependencies
 */
var subgroupsPolicy = require('../policies/subgroups.server.policy'),
  subgroups = require('../controllers/subgroups.server.controller');

module.exports = function(app) {
  // Subgroups Routes
  app.route('/api/subgroups').all(subgroupsPolicy.isAllowed)
    .get(subgroups.list)
    .post(subgroups.create);

  app.route('/api/subgroups/:subgroupId').all(subgroupsPolicy.isAllowed)
    .get(subgroups.read)
    .put(subgroups.update)
    .delete(subgroups.delete);

  // Finish by binding the Subgroup middleware
  app.param('subgroupId', subgroups.subgroupByID);
};