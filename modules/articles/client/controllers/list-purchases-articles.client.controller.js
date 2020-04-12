(function () {
  'use strict';

  angular
    .module('articles')
    .controller('PurchasesArticlesListController', PurchasesArticlesListController);

  PurchasesArticlesListController.$inject = ['$scope', '$state', 'ArticlesPurchasesService', 'StatesService', 'ZonesService', 'NgTableParams', 'localStorageService', 'sweet'];

  function PurchasesArticlesListController($scope, $state, ArticlesPurchasesService, StatesService, ZonesService, NgTableParams, localStorageService, sweet) {
    var self = this;

    //Parametros de la tabla de articulos.
    var tableParams = {};
    var purchasesArticlesTableParams = localStorageService.get('purchasesArticlesTableParams');
    if (purchasesArticlesTableParams !== null) {
      tableParams = purchasesArticlesTableParams;
    } else {
      tableParams = {
        page: 1,
        count: 5,
        filter: {},
        sorting: {
          purchase_number: 'desc'
        }
      };
    }

    //Configuracion inicial de la tabla de articulos.
    var tableSettings = {
      total: 0,
      counts: [5, 10, 50, 100, 200, 500],
      getData: function($defer, params) {
        tableParams = params.parameters();
        localStorageService.set('purchasesArticlesTableParams', tableParams);
        localStorageService.set('zonesPurchasesOrder', $scope.zone);
        var parametros = Object.assign(params.url(), { id_zone: $scope.zone });
        ArticlesPurchasesService.get(parametros, function(response) {
          params.total(response.total);
          $defer.resolve(response.results);
        });
      }
    };

    //Estados para filtrar.
    $scope.states = StatesService.getStatesPurchasesFilter();

    //Filtros de las zonas.
    $scope.zoneOptions = [];
    var getZoneFilter = function () {
      ZonesService.getZones().then(function(data) {
        $scope.zoneOptions = data;

        var zonesPurchasesOrder = localStorageService.get('zonesPurchasesOrder');
        if (zonesPurchasesOrder !== null) {
          $scope.zone = zonesPurchasesOrder;
        } else{
          $scope.zone = $scope.zoneOptions[0].id_zone;
        }

        //************************************* NgTableParams **************************************
        //Se genera la tabla de articulos.
        self.tableParams = new NgTableParams(tableParams, tableSettings);

        //Se observa el cambio de parametros y se los va guardando en el localStorage.
        $scope.$watch('tableParams', function () {
          localStorageService.set('purchasesArticlesTableParams', tableParams);
        }, true);
      });
    };
    getZoneFilter();

    //************************************* Actions **************************************
    $scope.changeZone = function(){
      localStorageService.set('zonesPurchasesOrder', $scope.zone);
      self.tableParams.reload();
    };

    $scope.addPurchaseOrder = function(){
      var ajax_params = {
        id_zone: $scope.zone
      };
      ArticlesPurchasesService
      .addPurchaseOrder(ajax_params)
      .$promise.then(function (result) {
        if(result[0].error){
          sweet.show({
            title: 'Error al agregar una nueva oc.',
            text: result[0].msg,
            animation: 'slide-from-top'
          });
        } else{
          var text = 'Se agregó una nueva orden de compra.';
          sweet.show({
            title: 'OK OC',
            text: text,
            type: 'success',
            animation: 'slide-from-top'
          });
          self.tableParams.reload();
        }
      }, function(error) {
        console.log(error);
      });
    };
  }
})();
