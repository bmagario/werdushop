//User service used to communicate User REST endpoints
(function () {
  'use strict';

  angular
    .module('users.payment')
    .factory('UsersDebtsService', UsersDebtsService);

  UsersDebtsService.$inject = ['$resource'];

  function UsersDebtsService($resource) {
    var url, defaultParams, actions;

    url = '/api/users_debts/:id_user/';
    defaultParams = { id_user: '@id_user' };
    actions = {
      loadPayment: { url: '/api/users_debts/load_payment/', method: 'POST', isArray: true },
    };

    return $resource(url, defaultParams, actions);
  }
})();
