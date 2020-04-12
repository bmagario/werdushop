(function () {
  'use strict';

  angular
    .module('subaccounts')
    .controller('SubaccountsListController', SubaccountsListController);

  SubaccountsListController.$inject = ['$scope', '$state', 'SubaccountsService', 'AccountsService', 'StatesService', 'NgTableParams', 'localStorageService'];

  function SubaccountsListController($scope, $state, SubaccountsService, AccountsService, StatesService, NgTableParams, localStorageService) {
    //Estados para filtrar.
    $scope.states = StatesService.getStatesFilter();

    //Centros de Costo para filtrar.
    $scope.accounts = [{ 'id': '0', title: 'Todos' }];
    var getAccountsFilter = function () {
      AccountsService.query({
        all: true
      }).$promise.then(function(data) {
        for(var d = 0; d < data.length; d++){
          $scope.accounts.push({ 'id': data[d].id_account, 'title': data[d].description });
        }
      });
    };
    getAccountsFilter();

    //Parametros de la tabla de subaccounts.
    var tableParams = {};
    var subaccountsTableParams = localStorageService.get('subaccountsTableParams');
    if (subaccountsTableParams !== null) {
      tableParams = subaccountsTableParams;
    } else {
      tableParams = {
        page: 1,
        count: 5,
        filter: { id_status: 1 },
        sorting: {
          sacc_description: 'asc'
        }
      };
    }

    //Configuracion inicial de la tabla de subaccounts.
    var tableSettings = {
      total: 0,
      counts: [5, 10, 15],
      getData: function($defer, params) {
        tableParams = params.parameters();
        localStorageService.set('subaccountsTableParams', tableParams);
        SubaccountsService.get(params.url(), function(response) {
          params.total(response.total);
          $defer.resolve(response.results);
        });
      }
    };

    //Se genera la tabla de subaccounts.
    $scope.tableParams = new NgTableParams(tableParams, tableSettings);

    //Se observa el cambio de parametros y se los va guardando en el localStorage.
    $scope.$watch('tableParams', function () {
      localStorageService.set('subaccountsTableParams', tableParams);
    }, true);

    // Remove existing Subaccount.
    $scope.remove = function(subaccount) {
      if (confirm('¿Está seguro que quiere dar de baja a esta subcuenta?')) {
        SubaccountsService.remove({ id_subaccount: subaccount.id_subaccount }, function () {
          $scope.tableParams.reload();
        });
      }
    };
  }
})();
