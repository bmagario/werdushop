'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Providers Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/providers',
      permissions: '*'
    }, {
      resources: '/api/providers/:id_provider',
      permissions: '*'
    }, {
      resources: '/api/providers_debts',
      permissions: '*'
    }, {
      resources: '/api/providers_debts/:id_providerDebt',
      permissions: '*'
    }, {
      resources: '/api/providers_debts/load_payment',
      permissions: '*'
    }]
  }]);
};

/**
 * Check If Providers Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  if (req.provider) {
    return next();
  }

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred
      return res.status(500).send('Unexpected authorization error');
    } else {
      if (isAllowed) {
        console.log('Providers isAllowed = ');
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
