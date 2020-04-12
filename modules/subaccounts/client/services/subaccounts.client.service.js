//Subaccounts service used to communicate Subaccounts REST endpoints
(function () {
  'use strict';

  angular
    .module('subaccounts')
    .factory('SubaccountsService', SubaccountsService);

  SubaccountsService.$inject = ['$resource'];

  function SubaccountsService($resource) {
    var url, defaultParams, actions;

    url = '/api/subaccounts/:id_subaccount/';
    defaultParams = { id_subaccount: '@id_subaccount' };
    actions = {
      update: { method: 'PUT' },
      getSubaccountsUsersProviders: { url: '/api/subaccounts/get_subaccounts_users_providers/', method: 'GET', isArray: true }
    };

    return $resource(url, defaultParams, actions);
  }
})();
