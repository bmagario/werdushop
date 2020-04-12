'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Cuentas Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/cash',
      permissions: '*'
    }, {
      resources: '/api/cash/get_cash',
      permissions: '*'
    }, {
      resources: '/api/cash/get_cash_history',
      permissions: '*'
    }, {
      resources: '/api/cash/load_subaccount',
      permissions: '*'
    }, {
      resources: '/api/cash/load_start_cash_count',
      permissions: '*'
    }, {
      resources: '/api/cash/load_final_cash_count',
      permissions: '*'
    }]
  }]);
};

/**
 * Check If Cuentas Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  if (req.cash) {
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
          message: 'Usuario no autorizado.'
        });
      }
    }
  });
};
