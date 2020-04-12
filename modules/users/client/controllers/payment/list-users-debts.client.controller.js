(function () {
  'use strict';

  angular
  .module('users.payment')
  .controller('UsersDebtsListController', UsersDebtsListController);

  UsersDebtsListController.$inject = ['$scope', '$state', 'UsersDebtsService', 'NgTableParams', 'localStorageService'];

  function UsersDebtsListController($scope, $state, UsersDebtsService, NgTableParams, localStorageService) {
    //Parametros de la tabla de proveedores.
    var tableParams = {};
    var usersDebtsTableParams = localStorageService.get('usersDebtsTableParams');
    if (usersDebtsTableParams !== null) {
      tableParams = usersDebtsTableParams;
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

    //Configuracion de la tabla de usuarios.
    var tableSettings = {
      total: 0,
      counts: [5, 10, 15],
      getData: function($defer, params) {
        tableParams = params.parameters();
        localStorageService.set('usersDebtsTableParams', tableParams);
        UsersDebtsService.get(params.url(), function(response) {
          params.total(response.total);
          $defer.resolve(response.results);
        });
      }
    };

    //Se obtiene la tabla de proveedores.
    $scope.tableParams = new NgTableParams(tableParams, tableSettings);

    //Se observa por cambios en los parametros de la tabla de proveedores.
    $scope.$watch('tableParams', function () {
      localStorageService.set('usersDebtsTableParams', tableParams);
    }, true);
  }
})();
