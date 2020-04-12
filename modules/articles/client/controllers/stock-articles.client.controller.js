(function () {
  'use strict';
  angular
    .module('articles')
    .controller('ArticlesStocksController', ArticlesStocksController);

  ArticlesStocksController.$inject = ['$scope', '$state', 'ArticlesStocksService', 'ZonesService', 'SubgroupsService', 'NgTableParams', 'localStorageService', 'sweet'];

  function ArticlesStocksController($scope, $state, ArticlesStocksService, ZonesService, SubgroupsService, NgTableParams, localStorageService, sweet) {
    var self = this;

    //Parametros de la tabla de articulos.
    var tableParams = {};
    var originalData = {};
    var articlesTableParams = localStorageService.get('articlesStocksTableParams');
    if (articlesTableParams !== null) {
      tableParams = articlesTableParams;
    } else {
      tableParams = {
        page: 1,
        count: 5,
        filter: { id_status: 0 },
        sorting: {
          name: 'asc'
        }
      };
    }

    //Configuracion inicial de la tabla de articulos.
    $scope.total_valued = 0;
    var tableSettings = {
      total: 0,
      counts: [5, 10, 50, 100, 200, 500],
      getData: function($defer, params) {
        tableParams = params.parameters();
        localStorageService.set('articlesStocksTableParams', tableParams);
        localStorageService.set('zonesStock', $scope.zone);
        var parametros = Object.assign(params.url(), { id_zone: $scope.zone });
        ArticlesStocksService.get(parametros, function(response) {
          params.total(response.total);

          //Agrego al scope el listado de articulos.
          $scope.articles = response.results;

          //Total Valorizado.
          $scope.total_valued = response.total_valued;

          //Se guarda la data original de los articulos
          originalData = angular.copy($scope.articles);
          $defer.resolve($scope.articles);
        });
      }
    };

    //Subgrupos para filtrar.
    $scope.subgroups = [{ 'id': '0', title: 'Todos' }];
    var getSubgroupsFilter = function () {
      SubgroupsService.query({
        all: true
      }).$promise.then(function(data) {
        for(var d = 0; d < data.length; d++){
          $scope.subgroups.push({ 'id': data[d].id_subgroup, 'title': data[d].name });
        }
      });
    };
    getSubgroupsFilter();

    //Filtros de las zonas.
    $scope.zoneOptions = [];
    var getZoneFilter = function () {
      ZonesService.getZones().then(function(data) {
        $scope.zoneOptions = data;

        var zonesStock = localStorageService.get('zonesStock');
        if (zonesStock !== null) {
          $scope.zone = zonesStock;
        } else{
          $scope.zone = $scope.zoneOptions[0].id_zone;
        }

        //************************************* NgTableParams **************************************
        //Se genera la tabla de articulos.
        self.tableParams = new NgTableParams(tableParams, tableSettings);

        //Se observa el cambio de parametros y se los va guardando en el localStorage.
        $scope.$watch('tableParams', function () {
          localStorageService.set('articlesStocksTableParams', tableParams);
        }, true);
      });
    };
    getZoneFilter();

    self.cancelChanges = cancelChanges;
    self.hasChanges = hasChanges;
    self.setEditing = setEditing;
    self.loadStock = loadStock;

    function cancelChanges(article, rowForm) {
      var currentPage = self.tableParams.page();
      var originalRow = resetTableStatus(article, rowForm);
      angular.extend(article, originalRow);
      self.tableParams.page(currentPage);
    }

    function hasChanges(article, rowForm) {
      return rowForm.$dirty;
    }

    function setEditing(article, value) {
      article.isEditing = value;
    }

    function resetTableStatus(article, rowForm) {
      self.setEditing(article, false);
      rowForm.$setPristine();
      for (var i in originalData){
        if(originalData[i].id_article === article.id_article){
          return originalData[i];
        }
      }
    }

    // Load Stock.
    function loadStock(article) {
      if(article && $scope.zone !== undefined && $scope.zone !== null && $scope.zone !== ''){
        //Genero los parametros a enviar.
        var ajax_params = {
          article: article,
          id_zone: $scope.zone
        };
        ArticlesStocksService
        .loadStock(ajax_params)
        .$promise.then(function (result) {
          if(result[0].error){
            sweet.show(result[0].msg);
          }
          self.tableParams.reload();
        }, function(error) {
          self.setEditing(article, false);
          console.log(error);
        });
      }
    }
    //************************************* Actions **************************************
    $scope.changeLocation = function(){
      localStorageService.set('zonesStock', $scope.zone);
      self.tableParams.reload();
    };
  }
})();
