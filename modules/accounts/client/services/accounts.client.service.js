//Cuentas service used to communicate Cuentas REST endpoints
(function () {
  'use strict';

  angular
    .module('accounts')
    .factory('AccountsService', ['$resource',
    function($resource) {
      return $resource('api/accounts/:id_account', {
        id_account: '@id_account'
      }, {
        update: {
          method: 'PUT'
        }
      });
    }
  ]);
})();
