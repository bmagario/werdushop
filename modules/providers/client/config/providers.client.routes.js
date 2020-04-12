(function () {
  'use strict';

  angular
    .module('providers')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('providers', {
        abstract: true,
        url: '/providers',
        template: '<ui-view/>'
      })
      .state('providers.list', {
        url: '',
        templateUrl: 'modules/providers/client/views/list-providers.client.view.html',
        controller: 'ProvidersListController',
        data: {
          roles: ['admin'],
          pageTitle: 'Proveedores'
        }
      })
      .state('providers.create', {
        url: '/create',
        templateUrl: 'modules/providers/client/views/form-provider.client.view.html',
        controller: 'ProvidersController',
        controllerAs: 'vm',
        resolve: {
          providerResolve: newProvider
        },
        data: {
          roles: ['admin'],
          pageTitle : 'Agregar Proveedor'
        }
      })
      .state('providers.edit', {
        url: '/:id_provider/edit',
        templateUrl: 'modules/providers/client/views/form-provider.client.view.html',
        controller: 'ProvidersController',
        controllerAs: 'vm',
        resolve: {
          providerResolve: getProvider
        },
        data: {
          roles: ['admin'],
          pageTitle: 'Editar Proveedor {{ providerResolve.description }}'
        }
      })
      .state('providers.view', {
        url: '/:id_provider',
        templateUrl: 'modules/providers/client/views/view-provider.client.view.html',
        controller: 'ProvidersController',
        controllerAs: 'vm',
        resolve: {
          providerResolve: getProvider
        },
        data:{
          pageTitle: 'Proveedor {{ providerResolve.nombre_fantasia }}'
        }
      })
      .state('providers_debts', {
        abstract: true,
        url: '/providers_debts',
        template: '<ui-view/>'
      })
      .state('providers_debts.list', {
        url: '',
        templateUrl: 'modules/providers/client/views/list-providers-debts.client.view.html',
        controller: 'ProvidersDebtsListController',
        data: {
          roles: ['admin'],
          pageTitle: 'Cta. Cte. Proveedores'
        }
      })
      .state('providers_debts.view', {
        url: '/:id_provider',
        templateUrl: 'modules/providers/client/views/view-provider-debt.client.view.html',
        controller: 'ProvidersDebtsController',
        controllerAs: 'vm',
        resolve: {
          providerResolve: getProviderDebt
        },
        data:{
          pageTitle: 'Proveedor {{ providerResolve.nombre_fantasia }}'
        }
      });
  }

  getProvider.$inject = ['$stateParams', 'ProvidersService'];

  function getProvider($stateParams, ProvidersService) {
    return ProvidersService.get({
      id_provider: $stateParams.id_provider
    }).$promise;
  }

  newProvider.$inject = ['ProvidersService'];

  function newProvider(ProvidersService) {
    return new ProvidersService();
  }

  getProviderDebt.$inject = ['$stateParams', 'ProvidersDebtsService'];

  function getProviderDebt($stateParams, ProvidersDebtsService) {
    return ProvidersDebtsService.get({
      id_provider: $stateParams.id_provider
    }).$promise;
  }
})();
