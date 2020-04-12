(function () {
  'use strict';
  angular
    .module('articles')
    .controller('ArticlesConsumptionController', ArticlesConsumptionController);

  ArticlesConsumptionController.$inject = ['$scope', '$state', 'ZonesService', 'ArticlesConsumptionService', 'SubgroupsService', 'NgTableParams', 'localStorageService', 'sweet'];

  function ArticlesConsumptionController($scope, $state, ZonesService, ArticlesConsumptionService, SubgroupsService, NgTableParams, localStorageService, sweet) {
    var self = this;

    //Parametros de la tabla de articulos.
    var tableParams = {};
    var originalData = {};
    var articlesTableParams = localStorageService.get('articlesConsumptionTableParams');
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
        localStorageService.set('articlesConsumptionTableParams', tableParams);
        localStorageService.set('zoneConsumption', $scope.zone);
        var parametros = Object.assign(params.url(), { id_zone: $scope.zone });
        ArticlesConsumptionService.get(parametros, function(response) {
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

        var zonesConsumption = localStorageService.get('zonesConsumption');
        if (zonesConsumption !== null) {
          $scope.zone = zonesConsumption;
        } else{
          $scope.zone = $scope.zoneOptions[0].id_zone;
        }

        //************************************* NgTableParams **************************************
        //Se genera la tabla de articulos.
        self.tableParams = new NgTableParams(tableParams, tableSettings);

        //Se observa el cambio de parametros y se los va guardando en el localStorage.
        $scope.$watch('tableParams', function () {
          localStorageService.set('articlesConsumptionTableParams', tableParams);
        }, true);
      });
    };
    getZoneFilter();

    self.cancelChanges = cancelChanges;
    self.hasChanges = hasChanges;
    self.setEditing = setEditing;
    self.loadConsumption = loadConsumption;

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
    function loadConsumption(article) {
      if(article && $scope.zone !== undefined && $scope.zone !== null && $scope.zone !== ''){
        if(parseFloat(article.total_carga_consumption) <= parseFloat(article.total)){
          //Genero los parametros a enviar.
          var ajax_params = {
            article: article,
            id_zone: $scope.zone
          };
          ArticlesConsumptionService
          .loadConsumption(ajax_params)
          .$promise.then(function (result) {
            if(result[0].error){
              sweet.show(result[0].msg);
            }
            self.tableParams.reload();
          }, function(error) {
            self.setEditing(article, false);
            console.log(error);
          });
        } else{
          sweet.show('El total de consumo no puede ser superior al stock actual.');
        }
      }
    }
    //************************************* Actions **************************************
    $scope.changeZone = function(){
      localStorageService.set('zonesConsumption', $scope.zone);
      self.tableParams.reload();
    };
  }
})();
