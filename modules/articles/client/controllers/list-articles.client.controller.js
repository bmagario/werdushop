(function () {
  'use strict';

  angular
    .module('articles')
    .controller('ArticlesListController', ArticlesListController);

  ArticlesListController.$inject = ['$scope', '$state', 'ArticlesService', 'GroupsService', 'SubgroupsService', 'BrandsService', 'NgTableParams', 'localStorageService'];

  function ArticlesListController($scope, $state, ArticlesService, GroupsService, SubgroupsService, BrandsService, NgTableParams, localStorageService) {
    //Subgrupos para filtrar.
    $scope.subgroups = [{ 'id': '0', title: 'Todos' }];
    var getSubgroupsFilter = function () {
      SubgroupsService.query({
        no_complex: true
      }).$promise.then(function(data) {
        for(var d = 0; d < data.length; d++){
          $scope.subgroups.push({ 'id': data[d].id_subgroup, 'title': data[d].name });
        }
      });
    };
    getSubgroupsFilter();

    //Marcas para filtrar.
    $scope.brands = [{ 'id': '0', title: 'Todas' }];
    var getBrandsFilter = function () {
      BrandsService.query({
        all: true
      }).$promise.then(function(data) {
        for(var d = 0; d < data.length; d++){
          $scope.brands.push({ 'id': data[d].id_brand, 'title': data[d].name });
        }
      });
    };
    getBrandsFilter();

    $scope.season = {
      0: { 'name': 'ALTA','abbreviation': 'A' },
      1: { 'name': 'MEDIA','abbreviation': 'M' },
      2: { 'name': 'BAJA','abbreviation': 'B' },
      3: { 'name': 'NULA','abbreviation': 'N' }
    };

    //Parametros de la tabla de articulos.
    var tableParams = {};
    var articlesTableParams = localStorageService.get('articlesTableParams');
    if (articlesTableParams !== null) {
      tableParams = articlesTableParams;
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
        localStorageService.set('articlesTableParams', tableParams);
        ArticlesService.get(params.url(), function(response) {
          params.total(response.total);
          $defer.resolve(response.results);
        });
      }
    };

    //Se genera la tabla de articulos.
    $scope.tableParams = new NgTableParams(tableParams, tableSettings);

    //Se observa el cambio de parametros y se los va guardando en el localStorage.
    $scope.$watch('tableParams', function () {
      localStorageService.set('articlesTableParams', tableParams);
    }, true);

    // Remove existing Article.
    $scope.remove = function(article) {
      if (confirm('¿Está seguro que quiere dar de baja a este articulo?')) {
        ArticlesService.remove({ articleId: article.id_article }, function () {
          $scope.tableParams.reload();
        });
      }
    };
  }
})();