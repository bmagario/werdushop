(function () {
  'use strict';

  angular
  .module('providers')
  .controller('ProvidersListController', ProvidersListController);

  ProvidersListController.$inject = ['$scope', '$state', 'ProvidersService', 'StatesService', 'NgTableParams', 'localStorageService'];

  function ProvidersListController($scope, $state, ProvidersService, StatesService, NgTableParams, localStorageService) {
    //Se obtiene los estados para filtrar.
    $scope.states = StatesService.getStatesFilter();

    //Parametros de la tabla de proveedores.
    var tableParams = {};
    var providersTableParams = localStorageService.get('providersTableParams');
    if (providersTableParams !== null) {
      tableParams = providersTableParams;
    } else {
      tableParams = {
        page: 1,
        count: 5,
        filter: { id_status: 1 },
        sorting: {
          nombre_fantasia: 'asc'
        }
      };
    }

    //Configuracion de la tabla de proveedores.
    var tableSettings = {
      total: 0,
      counts: [5, 10, 15],
      getData: function($defer, params) {
        tableParams = params.parameters();
        localStorageService.set('providersTableParams', tableParams);
        ProvidersService.get(params.url(), function(response) {
          params.total(response.total);
          $defer.resolve(response.results);
        });
      }
    };

    //Se obtiene la tabla de proveedores.
    $scope.tableParams = new NgTableParams(tableParams, tableSettings);

    //Se observa por cambios en los parametros de la tabla de proveedores.
    $scope.$watch('tableParams', function () {
      localStorageService.set('providersTableParams', tableParams);
    }, true);

    // Remove existing Provider.
    $scope.remove = function(provider) {
      if (confirm('¿Está seguro que quiere dar de baja a este proveedor?')) {
        ProvidersService.remove({ id_provider: provider.id_provider }, function () {
          $scope.tableParams.reload();
        });
      }
    };
  }
})();
