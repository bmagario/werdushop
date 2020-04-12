(function () {
  'use strict';

  angular
  .module('groups')
  .controller('GroupsListController', GroupsListController);

  GroupsListController.$inject = ['$scope', '$state', 'GroupsService', 'StatesService', 'NgTableParams', 'localStorageService'];

  function GroupsListController($scope, $state, GroupsService, StatesService, NgTableParams, localStorageService) {
    //Se obtiene los estados para filtrar.
    $scope.states = StatesService.getStatesFilter();

    //Parametros de la tabla de grupos.
    var tableParams = {};
    var groupsTableParams = localStorageService.get('groupsTableParams');
    if (groupsTableParams !== null) {
      tableParams = groupsTableParams;
    } else {
      tableParams = {
        page: 1,
        count: 5,
        filter: { id_status: 1 },
        sorting: {
          group_name: 'asc'
        }
      };
    }

    //Configuracion de la tabla de grupos.
    var tableSettings = {
      total: 0,
      counts: [5, 10, 15],
      getData: function($defer, params) {
        tableParams = params.parameters();
        localStorageService.set('groupsTableParams', tableParams);
        GroupsService.get(params.url(), function(response) {
          params.total(response.total);
          $defer.resolve(response.results);
        });
      }
    };

    //Se obtiene la tabla de grupos.
    $scope.tableParams = new NgTableParams(tableParams, tableSettings);

    //Se observa por cambios en los parametros de la tabla de grupos.
    $scope.$watch('tableParams', function () {
      localStorageService.set('groupsTableParams', tableParams);
    }, true);

    // Remove existing Group
    $scope.remove = function(group) {
      if (confirm('¿Está seguro que quiere dar de baja a este grupo?')) {
        GroupsService.remove({ groupId: group.id_group }, function () {
          $scope.tableParams.reload();
        });
      }
    };
  }
})();