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
      resources: '/api/accounts',
      permissions: '*'
    }, {
      resources: '/api/accounts/:id_account',
      permissions: '*'
    }]
  }, {
    roles: ['admin'],
    allows: [{
      resources: '/api/accounts',
      permissions: ['get', 'post']
    }, {
      resources: '/api/accounts/:id_account',
      permissions: ['get']
    }]
  }, {
    roles: ['admin'],
    allows: [{
      resources: '/api/accounts',
      permissions: ['get']
    }, {
      resources: '/api/accounts/:id_account',
      permissions: ['get']
    }]
  }]);
};

/**
 * Check If Cuentas Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  if (req.account) {
    return next();
  }

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred
      return res.status(500).send('Unexpected authorization error');
    } else {
      if (isAllowed) {
        console.log('Cuentas isAllowed = ');console.log(isAllowed);
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
