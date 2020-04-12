(function () {
  'use strict';

  angular
    .module('groups')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
      .state('groups', {
        abstract: true,
        url: '/groups',
        template: '<ui-view/>'
      })
      .state('groups.list', {
        url: '',
        templateUrl: 'modules/groups/client/views/list-groups.client.view.html',
        controller: 'GroupsListController',
        data: {
          roles: ['admin'],
          pageTitle: 'Listado de Grupos'
        }
      })
      .state('groups.create', {
        url: '/create',
        templateUrl: 'modules/groups/client/views/form-group.client.view.html',
        controller: 'GroupsController',
        controllerAs: 'vm',
        resolve: {
          groupResolve: newGroup
        },
        data: {
          roles: ['admin'],
          pageTitle : 'Crear Grupos'
        }
      })
      .state('groups.edit', {
        url: '/:groupId/edit',
        templateUrl: 'modules/groups/client/views/form-group.client.view.html',
        controller: 'GroupsController',
        controllerAs: 'vm',
        resolve: {
          groupResolve: getGroup
        },
        data: {
          roles: ['admin'],
          pageTitle: 'Editar Grupo {{ groupResolve.name }}'
        }
      })
      .state('groups.view', {
        url: '/:groupId',
        templateUrl: 'modules/groups/client/views/view-group.client.view.html',
        controller: 'GroupsController',
        controllerAs: 'vm',
        resolve: {
          groupResolve: getGroup
        },
        data:{
          pageTitle: 'Grupo {{ groupResolve.name }}'
        }
      });
  }

  getGroup.$inject = ['$stateParams', 'GroupsService'];

  function getGroup($stateParams, GroupsService) {
    return GroupsService.get({
      groupId: $stateParams.groupId
    }).$promise;
  }

  newGroup.$inject = ['GroupsService'];

  function newGroup(GroupsService) {
    return new GroupsService();
  }
})();