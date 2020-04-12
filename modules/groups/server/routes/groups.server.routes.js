'use strict';

/**
 * Module dependencies
 */
var groupsPolicy = require('../policies/groups.server.policy'),
  groups = require('../controllers/groups.server.controller');

module.exports = function(app) {
  // Groups Routes
  app.route('/api/groups').all(groupsPolicy.isAllowed)
    .get(groups.list)
    .post(groups.create);

  app.route('/api/groups/:groupId').all(groupsPolicy.isAllowed)
    .get(groups.read)
    .put(groups.update)
    .delete(groups.delete);

  // Finish by binding the Group middleware
  app.param('groupId', groups.groupByID);
};