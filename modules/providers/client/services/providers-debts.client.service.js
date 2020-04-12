//Provider service used to communicate Provider REST endpoints
(function () {
  'use strict';

  angular
    .module('providers')
    .factory('ProvidersDebtsService', ProvidersDebtsService);

  ProvidersDebtsService.$inject = ['$resource'];

  function ProvidersDebtsService($resource) {
    var url, defaultParams, actions;

    url = '/api/providers_debts/:id_provider/';
    defaultParams = { id_provider: '@id_provider' };
    actions = {
      loadPayment: { url: '/api/providers_debts/load_payment/', method: 'POST', isArray: true },
    };

    return $resource(url, defaultParams, actions);
  }
})();
