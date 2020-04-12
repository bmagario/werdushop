(function () {
  'use strict';

  angular
    .module('cash')
    .controller('CashHistoryController', CashHistoryController);

  CashHistoryController.$inject = ['$scope', 'globals', '$state', 'CashService', 'ZonesService', 'SubaccountsService', 'UsersDebtsService', 'ProvidersDebtsService', 'NgTableParams', 'localStorageService', 'sweet'];

  function CashHistoryController($scope, globals, $state, CashService, ZonesService, SubaccountsService, UsersDebtsService, ProvidersDebtsService, NgTableParams, localStorageService, sweet) {
    var self = this;

    //Parametros de la tabla de la caja.
    var tableParams = {};
    var cashHistoryTableParams = localStorageService.get('cashHistoryTableParams');
    if (cashHistoryTableParams !== null) {
      tableParams = cashHistoryTableParams;
    } else {
      tableParams = {
        page: 1,
        count: 5,
        filter: { },
        sorting: {
          cash_type: 'asc'
        }
      };
    }

    //Configuracion inicial de la tabla de la caja.
    var tableSettings = {
      total: 0,
      counts: [5, 10, 50, 100],
      groupOptions: {
        isExpanded: false
      },
      groupBy: function(item) {
        return item.cash_type;
      },
      getData: function($defer, params) {
        tableParams = params.parameters();
        var parametros = Object.assign(params.url(), {
          id_zone: $scope.zone,
          date_from: $scope.date_from,
          date_to: $scope.date_to
        });
        var result = _checkParameters(parametros);
        if(result.error){
          sweet.show({
            title: 'Faltan Parámetros',
            text: result.msg,
            animation: 'slide-from-top'
          });
        } else{
          localStorageService.set('cashHistoryTableParams', tableParams);
          localStorageService.set('zonesCashHistory', $scope.zone);
          localStorageService.set('cashHistoryDateFrom', $scope.date_from);
          localStorageService.set('cashHistoryDateTo', $scope.date_to);

          CashService.getCashHistory(parametros, function(response) {
            $scope.cash = response[0].cash;
            params.total(response[0].detail.total);
            $defer.resolve(response[0].detail.results);
          });
        }
      }
    };

    self.isGroupHeaderRowVisible = true;
    self.isGroupable = isGroupable;
    self.toggleGroupability = toggleGroupability;

    function isGroupable($column){
      return !!$column.groupable() || $column.groupField;
    }

    function toggleGroupability($column){
      if ($column.groupable()) {
        $column.groupField = $column.groupable();
        $column.groupable.assign(self, false);
      } else {
        $column.groupable.assign(self, $column.groupField);
      }
    }

    //Se sumariza el total segun la agrupacion.
    $scope.sum_subaccounts = function(data){
      var total = 0;
      for(var i = 0; i < data.length; i++){
        var subaccount = data[i];
        total += parseFloat(subaccount.amount);
      }
      return total;
    };

    //Filtros de las zonas.
    $scope.zoneOptions = [];
    var getZoneFilter = function () {
      ZonesService.getZones().then(function(zones) {
        $scope.zoneOptions = zones;

        var zonesCashHistory = localStorageService.get('zonesCashHistory');
        if (zonesCashHistory !== null) {
          $scope.zone = zonesCashHistory;
        } else{
          $scope.zone = $scope.zoneOptions[0].id_zone;
        }

        //************************************* NgTableParams **************************************
        //Se genera la tabla de articulos.
        $scope.tableParams = new NgTableParams(tableParams, tableSettings);

        //Se observa el cambio de parametros y se los va guardando en el localStorage.
        $scope.$watch('tableParams', function () {
          localStorageService.set('cashHistoryTableParams', tableParams);
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
      } else if(parametros.date_from === undefined || parametros.date_from === null || parametros.date_from === ''){
        error = true;
        msg = 'Debe seleccionar una fecha desde.';
      } else if(parametros.date_to === undefined || parametros.date_to === null || parametros.date_to === ''){
        error = true;
        msg = 'Debe seleccionar una fecha to.';
      }

      return { error: error, msg: msg };
    }

    //************************************* Actions **************************************
    $scope.changeZone = function(){
      localStorageService.set('zonesCashHistory', $scope.zone);
      $scope.tableParams.reload();
    };

    $scope.changeCashHistoryDate = function(tipo){
      if(tipo === 'desde'){
        localStorageService.set('cashHistoryDateFrom', $scope.date_from);
      } else{
        localStorageService.set('cashHistoryDateTo', $scope.date_to);
      }
      $scope.tableParams.reload();
    };

    //########################################### DELIVERY DATE ###########################################
    $scope.today = function(tipo) {
      if(tipo === 'desde'){
        $scope.date_from = new Date();
      } else{
        $scope.date_to = new Date();
      }
    };
    var cashHistoryDateFrom = localStorageService.get('cashHistoryDateFrom');
    var cashHistoryDateTo = localStorageService.get('cashHistoryDateTo');
    if (cashHistoryDateFrom !== null) {
      $scope.date_from = cashHistoryDateFrom;
    } else{
      $scope.today('desde');
    }
    if (cashHistoryDateTo !== null) {
      $scope.date_to = cashHistoryDateTo;
    } else{
      $scope.today('hasta');
    }

    $scope.clear = function (tipo) {
      if(tipo === 'desde'){
        $scope.date_from = null;
      } else{
        $scope.date_to = null;
      }
    };

    $scope.toggleMin = function() {
      $scope.minDate = $scope.minDate ? null : new Date();
    };
    $scope.toggleMin();

    $scope.open = function($event, tipo) {
      $event.preventDefault();
      $event.stopPropagation();
      if(tipo === 'desde'){
        $scope.opened_from = true;
      } else{
        $scope.opened_to = true;
      }

    };

    $scope.dateOptions = {
      formatYear: 'yy',
      startingDay: 1
    };

    $scope.formats = ['dd/MM/yyyy'];
    $scope.format = $scope.formats[0];
  }
})();
