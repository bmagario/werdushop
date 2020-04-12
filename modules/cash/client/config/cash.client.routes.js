(function () {
  'use strict';

  angular
    .module('cash')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('cash', {
        abstract: true,
        url: '/cash',
        template: '<ui-view/>'
      })
      .state('cash.view', {
        url: '',
        templateUrl: 'modules/cash/client/views/cash.client.view.html',
        controller: 'CashController',
        data: {
          roles: ['admin'],
          pageTitle: 'Caja'
        }
      })
      .state('cash.history', {
        url: '/history',
        templateUrl: 'modules/cash/client/views/cash-history.client.view.html',
        controller: 'CashHistoryController',
        data: {
          roles: ['admin'],
          pageTitle: 'Historial Cajas'
        }
      });
  }
})();
