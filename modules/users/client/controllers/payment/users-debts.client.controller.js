(function () {
  'use strict';

  // Users controller
  angular
    .module('users.payment')
    .controller('UsersDebtsController', UsersDebtsController);

  UsersDebtsController.$inject = ['$scope', '$rootScope', '$state', 'Authentication', 'userResolve', 'UsersDebtsService', '$filter', 'NgTableParams', 'localStorageService', 'sweet'];

  function UsersDebtsController ($scope, $rootScope, $state, Authentication, user, UsersDebtsService, $filter, NgTableParams, localStorageService, sweet) {
    var vm = this;

    vm.authentication = Authentication;
    vm.user = user;
    $scope.payment = null;

    //Parametros de la tabla de proveedores.
    var tableParams = {};
    var usersDebtsDetailTableParams = localStorageService.get('usersDebtsDetailTableParams');
    if (usersDebtsDetailTableParams !== null) {
      tableParams = usersDebtsDetailTableParams;
    } else {
      tableParams = {
        page: 1,
        count: 5
      };
    }

    //Configuracion de la tabla de proveedores.
    var tableSettings = {
      total: vm.user.debts.length,
      counts: [5, 10, 15, 50, 100, 500],
      getData: function ($defer, params) {
        $scope.data = params.sorting() ? $filter('orderBy')(vm.user.debts, params.orderBy()) : vm.user.debts;
        $scope.data = params.filter() ? $filter('filter')($scope.data, params.filter()) : $scope.data;
        params.total($scope.data.length);
        $scope.data = $scope.data.slice((params.page() - 1) * params.count(), params.page() * params.count());
        tableParams = params.parameters();
        localStorageService.set('usersDebtsDetailTableParams', tableParams);
        $defer.resolve($scope.data);
      }
    };

    //Se obtiene la tabla de proveedores.
    $scope.tableParams = new NgTableParams(tableParams, tableSettings);

    //Se observa por cambios en los parametros de la tabla de proveedores.
    $scope.$watch('tableParams', function () {
      localStorageService.set('usersDebtsDetailTableParams', tableParams);
    }, true);

    //Funciones y variables varias.
    vm.error = null;
    vm.form = {};
    vm.atras = $rootScope.atras;
    vm.go_users = go_users;

    // Go to list of users.
    function go_users() {
      $state.go('users_debts.list');
    }

    $scope.loadPayment = function(){
      $scope.zone = 1;
      if($scope.payment){
        var ajax_params = {
          id_zone: $scope.zone,
          id_user_payment: vm.user.id_user_payment,
          amount: $scope.payment
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
