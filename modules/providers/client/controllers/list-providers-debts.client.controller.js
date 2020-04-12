(function () {
  'use strict';

  angular
  .module('providers')
  .controller('ProvidersDebtsListController', ProvidersDebtsListController);

  ProvidersDebtsListController.$inject = ['$scope', '$state', 'ProvidersDebtsService', 'NgTableParams', 'localStorageService'];

  function ProvidersDebtsListController($scope, $state, ProvidersDebtsService, NgTableParams, localStorageService) {
    //Parametros de la tabla de proveedores.
    var tableParams = {};
    var providersDebtsTableParams = localStorageService.get('providersDebtsTableParams');
    if (providersDebtsTableParams !== null) {
      tableParams = providersDebtsTableParams;
    } else {
      tableParams = {
        page: 1,
        count: 5,
        filter: { },
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
        localStorageService.set('providersDebtsTableParams', tableParams);
        ProvidersDebtsService.get(params.url(), function(response) {
          params.total(response.total);
          $defer.resolve(response.results);
        });
      }
    };

    //Se obtiene la tabla de proveedores.
    $scope.tableParams = new NgTableParams(tableParams, tableSettings);

    //Se observa por cambios en los parametros de la tabla de proveedores.
    $scope.$watch('tableParams', function () {
      localStorageService.set('providersDebtsTableParams', tableParams);
    }, true);
  }
})();
