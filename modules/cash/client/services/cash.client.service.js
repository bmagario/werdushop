//Cash service used to communicate Cash REST endpoints
(function () {
  'use strict';

  angular
    .module('cash')
    .factory('CashService', CashService);

  CashService.$inject = ['$resource'];

  function CashService($resource) {
    var url, defaultParams, actions;

    url = '/api/cash/';
    defaultParams = { };
    actions = {
      getCash: { url: '/api/cash/get_cash/', method: 'GET', isArray: true },
      getCashHistory: { url: '/api/cash/get_cash_history/', method: 'GET', isArray: true },
      loadPaymentSubaccount: { url: '/api/cash/load_subaccount/', method: 'POST', isArray: true },
      loadStartCashCount: { url: '/api/cash/load_start_cash_count/', method: 'POST', isArray: true },
      loadFinalCashCount: { url: '/api/cash/load_final_cash_count/', method: 'POST', isArray: true }
    };

    return $resource(url, defaultParams, actions);
  }
})();
