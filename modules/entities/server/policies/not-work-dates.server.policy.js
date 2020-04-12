'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Not Work Dates Permissions
 */
exports.invokeRolesPolicies = function() {
  acl.allow(
  [{ 
    roles: [ 'guest' ],
    allows: [ ]
  }, { 
    roles: [ 'user' ],
    allows: [ ]
  }, {
    roles: [ 'admin' ],
    allows: [{
      resources: '/api/get_not_work_dates/',
      permissions: 'get'
    }, {
      resources: '/api/add_not_work_dates/',
      permissions: 'post'
    },{
      resources: '/api/delete_all_not_work_dates/',
      permissions: 'post'
    }]
  }]);
};

/**
 * Check If Not Work Dates Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : [ 'guest' ];

  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred
      return res.status(500).send('Error de autorización inesperado');
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
