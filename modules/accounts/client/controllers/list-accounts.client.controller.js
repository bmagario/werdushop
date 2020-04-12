(function () {
  'use strict';

  angular
  .module('accounts')
  .controller('AccountsListController', AccountsListController);

  AccountsListController.$inject = ['$scope', '$state', 'AccountsService', 'StatesService', 'NgTableParams', 'localStorageService'];

  function AccountsListController($scope, $state, AccountsService, StatesService, NgTableParams, localStorageService) {
    //Se obtiene los estados para filtrar.
    $scope.states = StatesService.getStatesFilter();

    //Se obtienen los tipos de cuentas a filtrar.
    $scope.account_types = StatesService.getAccountTypesFilter();

    //Parametros de la tabla de cuentas.
    var tableParams = {};
    var cuentasTableParams = localStorageService.get('cuentasTableParams');
    if (cuentasTableParams !== null) {
      tableParams = cuentasTableParams;
    } else {
      tableParams = {
        page: 1,
        count: 5,
        filter: { id_status: 1 },
        sorting: {
          acc_description: 'asc'
        }
      };
    }

    //Configuracion de la tabla de cuentas.
    var tableSettings = {
      total: 0,
      counts: [5, 10, 15],
      getData: function($defer, params) {
        tableParams = params.parameters();
        localStorageService.set('cuentasTableParams', tableParams);
        AccountsService.get(params.url(), function(response) {
          params.total(response.total);
          $defer.resolve(response.results);
        });
      }
    };

    //Se obtiene la tabla de cuentas.
    $scope.tableParams = new NgTableParams(tableParams, tableSettings);

    //Se observa por cambios en los parametros de la tabla de cuentas.
    $scope.$watch('tableParams', function () {
      localStorageService.set('cuentasTableParams', tableParams);
    }, true);

    // Remove existing Cuenta.
    $scope.remove = function(account) {
      if (confirm('¿Está seguro que quiere dar de baja a este cuenta?')) {
        AccountsService.remove({ id_account: account.id_account }, function () {
          $scope.tableParams.reload();
        });
      }
    };
  }
})();
