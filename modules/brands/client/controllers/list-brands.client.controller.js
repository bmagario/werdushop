(function () {
  'use strict';

  angular
    .module('brands')
    .controller('BrandsListController', BrandsListController);

  BrandsListController.$inject = ['$scope', '$state', 'BrandsService', 'StatesService', 'NgTableParams', 'localStorageService'];

  function BrandsListController($scope, $state, BrandsService, StatesService, NgTableParams, localStorageService) {
    //Se obtiene los estados para filtrar.
    $scope.states = StatesService.getStatesFilter();

    //Parametros de la tabla de marcas.
    var tableParams = {};
    var brandsTableParams = localStorageService.get('brandsTableParams');
    if (brandsTableParams !== null) {
      tableParams = brandsTableParams;
    } else {
      tableParams = {
        page: 1,
        count: 5,
        filter: { id_status: 1 },
        sorting: {
          brand_name: 'asc'
        }
      };
    }

    //Configuracion de la tabla de marcas.
    var tableSettings = {
      total: 0,
      counts: [5, 10, 15],
      getData: function($defer, params) {
        tableParams = params.parameters();
        localStorageService.set('brandsTableParams', tableParams);
        BrandsService.get(params.url(), function(response) {
          params.total(response.total);
          $defer.resolve(response.results);
        });
      }
    };

    //Se obtiene la tabla de marcas.
    $scope.tableParams = new NgTableParams(tableParams, tableSettings);

    //Se observa por cambios en los parametros de la tabla de marcas.
    $scope.$watch('tableParams', function () {
      localStorageService.set('brandsTableParams', tableParams);
    }, true);

    // Remove existing brand.
    $scope.remove = function(brand) {
      if (confirm('¿Está seguro que quiere dar de baja a esta marca?')) {
        BrandsService.remove({ brandId: brand.id_brand }, function () {
          $scope.tableParams.reload();
        });
      }
    };
  }
})();