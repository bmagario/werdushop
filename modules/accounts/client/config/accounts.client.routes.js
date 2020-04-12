(function () {
  'use strict';

  angular
    .module('accounts')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('accounts', {
        abstract: true,
        url: '/accounts',
        template: '<ui-view/>'
      })
      .state('accounts.list', {
        url: '',
        templateUrl: 'modules/accounts/client/views/list-accounts.client.view.html',
        controller: 'AccountsListController',
        data: {
          roles: ['admin'],
          pageTitle: 'Cuentas'
        }
      })
      .state('accounts.create', {
        url: '/create',
        templateUrl: 'modules/accounts/client/views/form-account.client.view.html',
        controller: 'AccountsController',
        controllerAs: 'vm',
        resolve: {
          cuentaResolve: newAccount
        },
        data: {
          roles: ['admin'],
          pageTitle : 'Crear Cuenta'
        }
      })
      .state('accounts.edit', {
        url: '/:id_account/edit',
        templateUrl: 'modules/accounts/client/views/form-account.client.view.html',
        controller: 'AccountsController',
        controllerAs: 'vm',
        resolve: {
          cuentaResolve: getAccount
        },
        data: {
          roles: ['admin'],
          pageTitle: 'Editar Cuenta {{ cuentaResolve.description }}'
        }
      })
      .state('accounts.view', {
        url: '/:id_account',
        templateUrl: 'modules/accounts/client/views/view-account.client.view.html',
        controller: 'AccountsController',
        controllerAs: 'vm',
        resolve: {
          cuentaResolve: getAccount
        },
        data:{
          pageTitle: 'Cuenta {{ cuentaResolve.description }}'
        }
      });
  }

  getAccount.$inject = ['$stateParams', 'AccountsService'];

  function getAccount($stateParams, AccountsService) {
    return AccountsService.get({
      id_account: $stateParams.id_account
    }).$promise;
  }

  newAccount.$inject = ['AccountsService'];

  function newAccount(AccountsService) {
    return new AccountsService();
  }
})();
