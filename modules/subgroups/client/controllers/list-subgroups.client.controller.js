(function () {
  'use strict';

  angular
    .module('subgroups')
    .controller('SubgroupsListController', SubgroupsListController);

  SubgroupsListController.$inject = ['$scope', '$state', 'SubgroupsService', 'GroupsService', 'StatesService', 'NgTableParams', 'localStorageService'];

  function SubgroupsListController($scope, $state, SubgroupsService, GroupsService, StatesService, NgTableParams, localStorageService) {
    //Estados para filtrar.
    $scope.states = StatesService.getStatesFilter();

    //Grupos para filtrar.
    $scope.groups = [{ 'id': '0', title: 'Todos' }];
    var getGroupsFilter = function () {
      GroupsService.query({
        all: true
      }).$promise.then(function(data) {
        for(var d = 0; d < data.length; d++){
          $scope.groups.push({ 'id': data[d].id_group, 'title': data[d].name });
        }
      });
    };
    getGroupsFilter();

    //Parametros de la tabla de subgrupos.
    var tableParams = {};
    var subgroupsTableParams = localStorageService.get('subgroupsTableParams');
    if (subgroupsTableParams !== null) {
      tableParams = subgroupsTableParams;
    } else {
      tableParams = {
        page: 1,
        count: 5,
        filter: { id_status: 1 },
        sorting: {
          subgroup_name: 'asc'
        }
      };
    }

    //Configuracion inicial de la tabla de subgrupos.
    var tableSettings = {
      total: 0,
      counts: [5, 10, 15],
      getData: function($defer, params) {
        tableParams = params.parameters();
        localStorageService.set('subgroupsTableParams', tableParams);
        SubgroupsService.get(params.url(), function(response) {
          params.total(response.total);
          $defer.resolve(response.results);
        });
      }
    };

    //Se genera la tabla de subgrupos.
    $scope.tableParams = new NgTableParams(tableParams, tableSettings);

    //Se observa el cambio de parametros y se los va guardando en el localStorage.
    $scope.$watch('tableParams', function () {
      localStorageService.set('subgroupsTableParams', tableParams);
    }, true);

    // Remove existing Subgroup.
    $scope.remove = function(subgroup) {
      if (confirm('¿Está seguro que quiere dar de baja a este subgrupo?')) {
        SubgroupsService.remove({ subgroupId: subgroup.id_subgroup }, function () {
          $scope.tableParams.reload();
        });
      }
    };
  }
})();