(function () {
  'use strict';

  // Providers controller
  angular
    .module('providers')
    .controller('ProvidersDebtsController', ProvidersDebtsController);

  ProvidersDebtsController.$inject = ['$scope', '$rootScope', '$state', 'Authentication', 'providerResolve', 'ProvidersDebtsService', '$filter', 'NgTableParams', 'localStorageService', 'sweet'];

  function ProvidersDebtsController ($scope, $rootScope, $state, Authentication, provider, ProvidersDebtsService, $filter, NgTableParams, localStorageService, sweet) {
    var vm = this;

    vm.authentication = Authentication;
    vm.provider = provider;
    $scope.payment = null;

    //Parametros de la tabla de proveedores.
    var tableParams = {};
    var providersDebtsDetailTableParams = localStorageService.get('providersDebtsDetailTableParams');
    if (providersDebtsDetailTableParams !== null) {
      tableParams = providersDebtsDetailTableParams;
    } else {
      tableParams = {
        page: 1,
        count: 5
      };
    }

    //Configuracion de la tabla de proveedores.
    var tableSettings = {
      total: vm.provider.debts.length,
      counts: [5, 10, 15, 50, 100, 500],
      getData: function ($defer, params) {
        $scope.data = params.sorting() ? $filter('orderBy')(vm.provider.debts, params.orderBy()) : vm.provider.debts;
        $scope.data = params.filter() ? $filter('filter')($scope.data, params.filter()) : $scope.data;
        params.total($scope.data.length);
        $scope.data = $scope.data.slice((params.page() - 1) * params.count(), params.page() * params.count());
        tableParams = params.parameters();
        localStorageService.set('providersDebtsDetailTableParams', tableParams);
        $defer.resolve($scope.data);
      }
    };

    //Se obtiene la tabla de proveedores.
    $scope.tableParams = new NgTableParams(tableParams, tableSettings);

    //Se observa por cambios en los parametros de la tabla de proveedores.
    $scope.$watch('tableParams', function () {
      localStorageService.set('providersDebtsDetailTableParams', tableParams);
    }, true);

    //Funciones y variables varias.
    vm.error = null;
    vm.form = {};
    vm.atras = $rootScope.atras;
    vm.go_providers = go_providers;

    // Go to list of providers.
    function go_providers() {
      $state.go('providers_debts.list');
    }

    $scope.loadPayment = function(){
      $scope.zone = 1;
      if($scope.payment){
        var ajax_params = {
          id_zone: $scope.zone,
          id_provider_payment: vm.provider.id_provider_payment,
          amount: $scope.payment
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
              title: 'OK Carga de Pago',
              text: 'Se agregó el pago ',
              type: 'success',
              animation: 'slide-from-top'
            });
            $state.go($state.current, {}, { reload: true });
          }
        }, function(error) {
          console.log(error);
        });
      }
    };
  }
})();
