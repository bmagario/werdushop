(function () {
  'use strict';

  angular
    .module('articles')
    .controller('ComplexArticlesListController', ComplexArticlesListController);

  ComplexArticlesListController.$inject = ['$scope', '$state', 'ComplexArticlesService', 'GroupsService', 'SubgroupsService', 'BrandsService', 'NgTableParams', 'localStorageService'];

  function ComplexArticlesListController($scope, $state, ComplexArticlesService, GroupsService, SubgroupsService, BrandsService, NgTableParams, localStorageService) {
    //Subgrupos para filtrar.
    $scope.subgroups = [{ 'id': '0', title: 'Todos' }];
    var getSubgroupsFilter = function () {
      SubgroupsService.query({
        complex: true
      }).$promise.then(function(data) {
        for(var d = 0; d < data.length; d++){
          $scope.subgroups.push({ 'id': data[d].id_subgroup, 'title': data[d].name });
        }
      });
    };
    getSubgroupsFilter();

    //Parametros de la tabla de articulos.
    var tableParams = {};
    var complexArticlesTableParams = localStorageService.get('complexArticlesTableParams');
    if (complexArticlesTableParams !== null) {
      tableParams = complexArticlesTableParams;
    } else {
      tableParams = {
        page: 1,
        count: 5,
        filter: {},
        sorting: {
          name: 'asc'
        }
      };
    }

    //Configuracion inicial de la tabla de articulos.
    var tableSettings = {
      total: 0,
      counts: [5, 10, 50, 100, 200, 500],
      getData: function($defer, params) {
        tableParams = params.parameters();
        localStorageService.set('complexArticlesTableParams', tableParams);
        ComplexArticlesService.get(params.url(), function(response) {
          params.total(response.total);
          $defer.resolve(response.results);
        });
      }
    };

    //Se genera la tabla de articulos.
    $scope.tableParams = new NgTableParams(tableParams, tableSettings);

    //Se observa el cambio de parametros y se los va guardando en el localStorage.
    $scope.$watch('tableParams', function () {
      localStorageService.set('complexArticlesTableParams', tableParams);
    }, true);
  }
})();