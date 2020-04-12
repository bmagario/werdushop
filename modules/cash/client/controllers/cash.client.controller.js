(function () {
  'use strict';

  angular
    .module('cash')
    .controller('CashController', CashController);

  CashController.$inject = ['$scope', 'globals', '$state', 'CashService', 'ZonesService', 'SubaccountsService', 'UsersDebtsService', 'ProvidersDebtsService', 'NgTableParams', 'localStorageService', 'sweet'];

  function CashController($scope, globals, $state, CashService, ZonesService, SubaccountsService, UsersDebtsService, ProvidersDebtsService, NgTableParams, localStorageService, sweet) {
    var self = this;

    //Parametros de la tabla de la caja.
    var tableParams = {};
    var cashTableParams = localStorageService.get('cashTableParams');
    if (cashTableParams !== null) {
      tableParams = cashTableParams;
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
          id_zone: $scope.zone
        });

        if($scope.zone){
          localStorageService.set('cashTableParams', tableParams);
          localStorageService.set('zonesCash', $scope.zone);
          CashService.getCash(parametros, function(response) {
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

        var zonesCash = localStorageService.get('zonesCash');
        if (zonesCash !== null) {
          $scope.zone = zonesCash;
        } else{
          $scope.zone = $scope.zoneOptions[0].id_zone;
        }

        //************************************* NgTableParams **************************************
        //Se genera la tabla de articulos.
        $scope.tableParams = new NgTableParams(tableParams, tableSettings);

        //Se observa el cambio de parametros y se los va guardando en el localStorage.
        $scope.$watch('tableParams', function () {
          localStorageService.set('cashTableParams', tableParams);
        }, true);
      });
    };
    getZoneFilter();

    //Listado de subcuentas.
    $scope.subaccountOptions = [];
    var getSubaccountsUsersProviders = function () {
      SubaccountsService
      .getSubaccountsUsersProviders({})
      .$promise.then(function (result) {
        $scope.subaccountOptions = result;
      });
    };
    getSubaccountsUsersProviders();

    //************************************* Actions **************************************
    $scope.changeZone = function(){
      localStorageService.set('zonesCash', $scope.zone);
      $scope.tableParams.reload();
    };

    $scope.loadPayment = function(){
      if($scope.amount && $scope.payment){
        switch ($scope.payment.type) {
          case globals.INGRESO:
            loadPaymentSubaccount();
            break;
          case globals.EGRESO:
            loadPaymentSubaccount();
            break;
          case globals.USERS:
            loadPaymentUser();
            break;
          case globals.PROVIDERS:
            loadPaymentProvider();
            break;
        }
      }
    };

    function loadPaymentSubaccount(){
      var ajax_params = {
        id_zone: $scope.zone,
        id_cash: $scope.cash.id_cash,
        id_subaccount: $scope.payment.id_subaccount,
        amount: $scope.amount
      };
      CashService
      .loadPaymentSubaccount(ajax_params)
      .$promise.then(function (result) {
        if(result[0].error){
          sweet.show({
            title: 'Error Carga de Pago',
            text: result[0].msg,
            animation: 'slide-from-top'
          });
        } else{
          sweet.show({
            title: 'OK Carga Pago',
            text: 'Se agregó el pago ',
            type: 'success',
            animation: 'slide-from-top'
          });
          $scope.tableParams.reload();
        }
      }, function(error) {
        console.log(error);
      });
    }

    function loadPaymentUser(){
      var ajax_params = {
        id_zone: $scope.zone,
        id_cash: $scope.cash.id_cash,
        id_user_payment: $scope.payment.id_user_payment,
        amount: $scope.amount
      };
      UsersDebtsService
      .loadPayment(ajax_params)
      .$promise.then(function (result) {
        if(result[0].error){
          sweet.show({
            title: 'Error Carga de Pago',
            text: result[0].msg,
            animation: 'slide-from-top'
          });
        } else{
          sweet.show({
            title: 'OK Carga Pago',
            text: 'Se agregó el pago ',
            type: 'success',
            animation: 'slide-from-top'
          });
          $scope.tableParams.reload();
          getSubaccountsUsersProviders();
        }
      }, function(error) {
        console.log(error);
      });
    }

    function loadPaymentProvider(){
      var ajax_params = {
        id_zone: $scope.zone,
        id_cash: $scope.cash.id_cash,
        id_provider_payment: $scope.payment.id_provider_payment,
        amount: $scope.amount
      };
      ProvidersDebtsService
      .loadPayment(ajax_params)
      .$promise.then(function (result) {
        if(result[0].error){
          sweet.show({
            title: 'Error Carga de Pago',
            text: result[0].msg,
            animation: 'slide-from-top'
          });
        } else{
          sweet.show({
            title: 'OK Carga Pago',
            text: 'Se agregó el pago ',
            type: 'success',
            animation: 'slide-from-top'
          });
          $scope.tableParams.reload();
          getSubaccountsUsersProviders();
        }
      }, function(error) {
        console.log(error);
      });
    }

    $scope.loadStartCashCount = function(){
      if($scope.start_cash_count){
        var ajax_params = {
          id_zone: $scope.zone,
          id_cash: $scope.cash.id_cash,
          start_cash_count: $scope.start_cash_count
        };
        CashService
        .loadStartCashCount(ajax_params)
        .$promise.then(function (result) {
          if(result[0].error){
            sweet.show({
              title: 'Error Carga de Arqueo Inicial',
              text: result[0].msg,
              animation: 'slide-from-top'
            });
          } else{
            sweet.show({
              title: 'OK Carga Arqueo Inicial',
              text: 'Se agregó el arqueo inicial ',
              type: 'success',
              animation: 'slide-from-top'
            });
            $state.reload();
          }
        }, function(error) {
          console.log(error);
        });
      }
    };

    $scope.loadFinalCashCount = function(){
      if($scope.final_cash_count){
        var ajax_params = {
          id_zone: $scope.zone,
          id_cash: $scope.cash.id_cash,
          final_cash_count: $scope.final_cash_count
        };
        CashService
        .loadFinalCashCount(ajax_params)
        .$promise.then(function (result) {
          if(result[0].error){
            sweet.show({
              title: 'Error Carga de Arqueo Final',
              text: result[0].msg,
              animation: 'slide-from-top'
            });
          } else{
            sweet.show({
              title: 'OK Carga Arqueo Final (Cierre de Caja)',
              text: 'Se agregó el arqueo final, y se cerró la caja. ',
              type: 'success',
              animation: 'slide-from-top'
            });
            $state.reload();
          }
        }, function(error) {
          console.log(error);
        });
      }
    };

  }
})();
