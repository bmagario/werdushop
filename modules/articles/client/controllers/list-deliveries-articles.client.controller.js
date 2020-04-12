(function () {
  'use strict';

  angular
    .module('articles')
    .controller('DeliveriesArticlesListController', DeliveriesArticlesListController);

  DeliveriesArticlesListController.$inject = ['$scope', 'globals', '$state', 'ArticlesDeliveriesService', 'StatesService', 'ZonesService', 'FilesService', 'NgTableParams', 'localStorageService', 'sweet', 'FileSaver'];

  function DeliveriesArticlesListController($scope, globals, $state, ArticlesDeliveriesService, StatesService, ZonesService, FilesService, NgTableParams, localStorageService, sweet, FileSaver) {
    var self = this;

    //Estados para filtrar.
    $scope.states = StatesService.getStatesBasketFilter();

    //Parametros de la tabla de articulos.
    var tableParams = {};
    var deliveriesArticlesTableParams = localStorageService.get('deliveriesArticlesTableParams');
    if (deliveriesArticlesTableParams !== null) {
      tableParams = deliveriesArticlesTableParams;
    } else {
      tableParams = {
        page: 1,
        count: 5,
        filter: {},
        sorting: {
          number: 'asc'
        }
      };
    }

        //Configuracion inicial de la tabla de articulos.
    var tableSettings = {
      total: 0,
      counts: [5, 10, 50, 100, 200, 500],
      getData: function($defer, params) {
        tableParams = params.parameters();
        var parametros = Object.assign(params.url(), {
          id_zone: $scope.zone,
          date_basket: $scope.date_basket,
          delivery_hour: $scope.delivery_hour
        });
        var result = _checkParameters(parametros);
        if(result.error){
          sweet.show({
            title: 'Faltan Parámetros',
            text: result.msg,
            animation: 'slide-from-top'
          });
        } else{
          localStorageService.set('deliveriesArticlesTableParams', tableParams);
          localStorageService.set('zonesDeliveries', $scope.zone);
          localStorageService.set('deliveryDateDeliveries', $scope.date_basket);
          localStorageService.set('deliveryHourDeliveries', $scope.delivery_hour);
          ArticlesDeliveriesService.get(parametros, function(response) {
            params.total(response.total);
            $defer.resolve(response.results);
          });
        }
      }
    };

    //Filtros de las zonas.
    $scope.zoneOptions = [];
    $scope.deliveryHourOptions = [];
    var getZoneFilter = function () {
      var zoneDeliveries = localStorageService.get('zonesDeliveries');
      if (zoneDeliveries !== null) {
        $scope.zone = zoneDeliveries;
      } else{
        $scope.zone = globals.ZONES.BAHIA_BLANCA_1;
      }
      ZonesService
      .getZonesAndDeliveryHours({ id_zone: $scope.zone })
      .then(function(data) {
        $scope.zoneOptions = data.zones;
        $scope.deliveryHourOptions = data.deliveryHours;

        var zoneDeliveries = localStorageService.get('zonesDeliveries');
        if (zoneDeliveries !== null) {
          $scope.zone = zoneDeliveries;
        } else{
          $scope.zone = $scope.zoneOptions[0].id_zone;
        }

        var deliveryHour = localStorageService.get('deliveryHourDeliveries');
        if (deliveryHour !== null) {
          $scope.delivery_hour = deliveryHour;
        } else{
          $scope.delivery_hour = $scope.deliveryHourOptions[0];
        }

        //************************************* NgTableParams **************************************
        //Se genera la tabla de articulos.
        self.tableParams = new NgTableParams(tableParams, tableSettings);

        //Se observa el cambio de parametros y se los va guardando en el localStorage.
        $scope.$watch('tableParams', function () {
          localStorageService.set('deliveriesArticlesTableParams', tableParams);
        }, true);
      });
    };
    getZoneFilter();

    function _checkParameters(parametros){
      var error = false;
      var msg = '';
      if(parametros.id_zone === undefined || parametros.id_zone === null){
        error = true;
        msg = 'Debe seleccionar una zona.';
      } else if(parametros.date_basket === undefined || parametros.date_basket === null || parametros.date_basket === ''){
        error = true;
        msg = 'Debe seleccionar una fecha.';
      } else if(parametros.delivery_hour === undefined || parametros.delivery_hour === null || parametros.delivery_hour === ''){
        error = true;
        msg = 'Debe seleccionar un horario de entrega.';
      }

      return { error: error, msg: msg };
    }

    //************************************* Actions **************************************
    $scope.changeZone = function(){
      localStorageService.set('zonesDeliveries', $scope.zone);
      self.tableParams.reload();
    };

    $scope.changeDeliveryDate = function(){
      localStorageService.set('deliveryDateDeliveries', $scope.date_basket);
      self.tableParams.reload();
    };

    $scope.changeDeliveryHour = function(){
      localStorageService.set('deliveryHourDeliveries', $scope.delivery_hour);
      self.tableParams.reload();
    };

    $scope.downloadDeliveryPanel = function(){
      var ajax_params = {
        id_zone: $scope.zone,
        date_basket: $scope.date_basket,
        delivery_hour: $scope.delivery_hour
      };
      var result = _checkParameters(ajax_params);
      if(result.error){
        sweet.show({
          title: 'Faltan Parámetros',
          text: result.msg,
          animation: 'slide-from-top'
        });
      } else{
        localStorageService.set('zonesDeliveries', $scope.zone);
        localStorageService.set('deliveryDateDeliveries', $scope.date_basket);
        localStorageService.set('deliveryHourDeliveries', $scope.delivery_hour);
        FilesService
        .downloadDeliveriesPanel(ajax_params)
        .then(function (response) {
          var filename = 'OEPANEL_'+$scope.zone+'_'+$scope.date_basket+'_'+$scope.delivery_hour+'.xlsx';
          var blob = new Blob([response.data], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=utf-8'
          });
          FileSaver.saveAs(blob, filename);
        }, function (error) {
          console.log(error);
        });
      }
    };

    $scope.downloadDeliveries = function(canastero){
      var ajax_params = {
        id_zone: $scope.zone,
        date_basket: $scope.date_basket,
        delivery_hour: $scope.delivery_hour,
        canastero: canastero
      };
      var result = _checkParameters(ajax_params);
      if(result.error){
        sweet.show({
          title: 'Faltan Parámetros',
          text: result.msg,
          animation: 'slide-from-top'
        });
      } else{
        localStorageService.set('zonesDeliveries', $scope.zone);
        localStorageService.set('deliveryDateDeliveries', $scope.date_basket);
        localStorageService.set('deliveryHourDeliveries', $scope.delivery_hour);
        FilesService
        .downloadDeliveries(ajax_params)
        .then(function (response) {
          var filename = 'OECLIENTES_'+$scope.zone+'_'+$scope.date_basket+'_'+$scope.delivery_hour+'.pdf';
          if(canastero){
            filename = 'OECANASTERO_'+$scope.zone+'_'+$scope.date_basket+'_'+$scope.delivery_hour+'.pdf';
          }
          var blob = new Blob([response.data], {
            type: 'application/pdf'
          });
          FileSaver.saveAs(blob, filename);
        }, function (error) {
          console.log(error);
        });
      }
    };

    //########################################### DELIVERY DATE ###########################################
    $scope.today = function() {
      $scope.date_basket = new Date();
    };
    var deliveryDate = localStorageService.get('deliveryDateDeliveries');
    if (deliveryDate !== null) {
      $scope.date_basket = deliveryDate;
    } else{
      $scope.today();
    }

    $scope.clear = function () {
      $scope.date_basket = null;
    };

    $scope.toggleMin = function() {
      $scope.minDate = $scope.minDate ? null : new Date();
    };
    $scope.toggleMin();

    $scope.open = function($event) {
      $event.preventDefault();
      $event.stopPropagation();

      $scope.opened = true;
    };

    $scope.dateOptions = {
      formatYear: 'yy',
      startingDay: 1
    };

    $scope.formats = ['dd/MM/yyyy'];
    $scope.format = $scope.formats[0];
  }
})();
