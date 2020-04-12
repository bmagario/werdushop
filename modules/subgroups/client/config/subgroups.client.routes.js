(function () {
  'use strict';

  angular
    .module('subgroups')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('subgroups', {
        abstract: true,
        url: '/subgroups',
        template: '<ui-view/>'
      })
      .state('subgroups.list', {
        url: '',
        templateUrl: 'modules/subgroups/client/views/list-subgroups.client.view.html',
        controller: 'SubgroupsListController',
        controllerAs: 'vm',
        data: {
          roles: ['admin'],
          pageTitle: 'Listado de Subgrupos'
        }
      })
      .state('subgroups.create', {
        url: '/create',
        templateUrl: 'modules/subgroups/client/views/form-subgroup.client.view.html',
        controller: 'SubgroupsController',
        controllerAs: 'vm',
        resolve: {
          subgroupResolve: newSubgroup
        },
        data: {
          roles: ['admin'],
          pageTitle : 'Crear Subgrupo'
        }
      })
      .state('subgroups.edit', {
        url: '/:subgroupId/edit',
        templateUrl: 'modules/subgroups/client/views/form-subgroup.client.view.html',
        controller: 'SubgroupsController',
        controllerAs: 'vm',
        resolve: {
          subgroupResolve: getSubgroup
        },
        data: {
          roles: ['admin'],
          pageTitle: 'Editar Subgrupo {{ subgroupResolve.name }}'
        }
      })
      .state('subgroups.view', {
        url: '/:subgroupId',
        templateUrl: 'modules/subgroups/client/views/view-subgroup.client.view.html',
        controller: 'SubgroupsController',
        controllerAs: 'vm',
        resolve: {
          subgroupResolve: getSubgroup
        },
        data:{
          roles: ['admin'],
          pageTitle: 'Subgrupo {{ subgroupResolve.name }}'
        }
      });
  }

  getSubgroup.$inject = ['$stateParams', 'SubgroupsService'];

  function getSubgroup($stateParams, SubgroupsService) {
    return SubgroupsService.get({
      subgroupId: $stateParams.subgroupId
    }).$promise;
  }

  newSubgroup.$inject = ['SubgroupsService'];

  function newSubgroup(SubgroupsService) {
    return new SubgroupsService();
  }
})();