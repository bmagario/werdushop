'use strict';

// Users service used for communicating with the users REST endpoint
angular.module('users')
.factory('Users', ['$resource',
  function ($resource) {
    var url, defaultParams, actions;
    url = '';
    defaultParams = {};
    actions = {
      update: { url: '/api/users/', method: 'PUT' },
      updateAddress: { url: '/api/users/address/', method: 'POST', isArray: true },
      removeAddress: { url: '/api/users/remove_address/', method: 'POST', isArray: true },
      getAddress: { url: '/api/users/address/', method: 'GET', isArray: true }
    };
 
    return $resource(url, defaultParams, actions);
  }
]);

//TODO this should be Users service
angular.module('users.admin')
.factory('Admin', ['$resource',
  function ($resource) {
    return $resource('api/users/:userId', 
                    { userId: '@id_user' }, 
                    { update: { method: 'PUT' } }
                    );
  }
]);

