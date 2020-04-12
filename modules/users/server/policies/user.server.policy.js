'use strict';

/**
 * Module dependencies.
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Admin Permissions
 */
exports.invokeRolesPolicies = function () {
  acl.allow([{
    roles: ['admin'],
    allows: [{
      resources: '/api/users',
      permissions: '*'
    }, {
      resources: '/api/users/:userId',
      permissions: '*'
    },{
      resources: '/api/users/address',
      permissions: '*'
    },{
      resources: '/api/users/remove_address',
      permissions: '*'
    },{
      resources: '/api/users/accounts',
      permissions: 'delete'
    },{
      resources: '/api/users/password',
      permissions: 'post'
    },{
      resources: '/api/users/contact',
      permissions: 'post'
    }]
  }, {
    roles: [ 'user' ],
    allows: [{
      resources: '/api/users/me',
      permissions: 'get'
    },{
      resources: '/api/users',
      permissions: 'put'
    },{
      resources: '/api/users/address',
      permissions: '*'
    },{
      resources: '/api/users/remove_address',
      permissions: '*'
    },{
      resources: '/api/users/accounts',
      permissions: 'delete'
    },{
      resources: '/api/users/password',
      permissions: 'post'
    },{
      resources: '/api/users/contact',
      permissions: 'post'
    }]
  }, {
    roles: [ 'guest' ],
    allows: [{
      resources: '/api/users/contact',
      permissions: 'post'
    }]
  }]);
};

/**
 * Check If Admin Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : ['guest'];

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred.
      return res.status(500).send('Error inesperado en la autenticación.');
    } else {
      if (isAllowed) {
        // Access granted! Invoke next middleware
        return next();
      } else {
        return res.status(403).json({
          message: 'El usuario no está autorizado.'
        });
      }
    }
  });
};
