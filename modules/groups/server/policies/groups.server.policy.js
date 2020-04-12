'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Groups Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/groups',
      permissions: '*'
    }, {
      resources: '/api/groups/:groupId',
      permissions: '*'
    }]
  }, {
    roles: ['admin'],
    allows: [{
      resources: '/api/groups',
      permissions: ['get', 'post']
    }, {
      resources: '/api/groups/:groupId',
      permissions: ['get']
    }]
  }, {
    roles: ['admin'],
    allows: [{
      resources: '/api/groups',
      permissions: ['get']
    }, {
      resources: '/api/groups/:groupId',
      permissions: ['get']
    }]
  }]);
};

/**
 * Check If Groups Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  if (req.group) {
    return next();
  }

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred
      return res.status(500).send('Unexpected authorization error');
    } else {
      if (isAllowed) {
        console.log('Groups isAllowed = ');console.log(isAllowed);
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
