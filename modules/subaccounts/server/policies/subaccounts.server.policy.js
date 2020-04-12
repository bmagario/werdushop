'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Subaccounts Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/subaccounts',
      permissions: '*'
    }, {
      resources: '/api/subaccounts/get_subaccounts_users_providers',
      permissions: '*'
    }, {
      resources: '/api/subaccounts/:id_subaccount',
      permissions: '*'
    }, {
      resources: '/api/subaccounts/:id_subaccount/add_cost_center',
      permissions: '*'
    }, {
      resources: '/api/subaccounts/:id_subaccount/remove_cost_center',
      permissions: '*'
    }]
  }]);
};

/**
 * Check If Subaccounts Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  if (req.subaccount) {
    return next();
  }

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred
      return res.status(500).send('Unexpected authorization error');
    } else {
      if (isAllowed) {
        // Access granted! Invoke next middleware
        return next();
      } else {
        return res.status(403).json({
          message: 'User is not authorized'
        });
      }
    }
  });
};
