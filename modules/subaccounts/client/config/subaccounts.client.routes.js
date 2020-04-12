(function () {
  'use strict';

  angular
    .module('subaccounts')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('subaccounts', {
        abstract: true,
        url: '/subaccounts',
        template: '<ui-view/>'
      })
      .state('subaccounts.list', {
        url: '',
        templateUrl: 'modules/subaccounts/client/views/list-subaccounts.client.view.html',
        controller: 'SubaccountsListController',
        controllerAs: 'vm',
        data: {
          roles: ['admin'],
          pageTitle: 'Subcuentas'
        }
      })
      .state('subaccounts.create', {
        url: '/create',
        templateUrl: 'modules/subaccounts/client/views/form-subaccount.client.view.html',
        controller: 'SubaccountsController',
        controllerAs: 'vm',
        resolve: {
          subaccountResolve: newSubaccount
        },
        data: {
          roles: ['admin'],
          pageTitle : 'Crear Subcuenta'
        }
      })
      .state('subaccounts.edit', {
        url: '/:id_subaccount/edit',
        templateUrl: 'modules/subaccounts/client/views/form-subaccount.client.view.html',
        controller: 'SubaccountsController',
        controllerAs: 'vm',
        resolve: {
          subaccountResolve: getSubaccount
        },
        data: {
          roles: ['admin'],
          pageTitle: 'Editar Subcuenta {{ subaccountResolve.description }}'
        }
      })
      .state('subaccounts.view', {
        url: '/:id_subaccount',
        templateUrl: 'modules/subaccounts/client/views/view-subaccount.client.view.html',
        controller: 'SubaccountsController',
        controllerAs: 'vm',
        resolve: {
          subaccountResolve: getSubaccount
        },
        data:{
          roles: ['admin'],
          pageTitle: 'Subcuenta {{ subaccountResolve.descriptionme }}'
        }
      });
  }

  getSubaccount.$inject = ['$stateParams', 'SubaccountsService'];

  function getSubaccount($stateParams, SubaccountsService) {
    return SubaccountsService.get({
      id_subaccount: $stateParams.id_subaccount
    }).$promise;
  }

  newSubaccount.$inject = ['SubaccountsService'];

  function newSubaccount(SubaccountsService) {
    return new SubaccountsService();
  }
})();
