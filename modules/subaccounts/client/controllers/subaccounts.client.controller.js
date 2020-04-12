(function () {
  'use strict';

  // Subaccounts controller
  angular
    .module('subaccounts')
    .controller('SubaccountsController', SubaccountsController);

  SubaccountsController.$inject = ['$scope', '$rootScope', '$state', 'Authentication', 'subaccountResolve', 'SubaccountsService', 'AccountsService', 'StatesService'];

  function SubaccountsController ($scope, $rootScope, $state, Authentication, subaccount, SubaccountsService, AccountsService, StatesService) {
    var vm = this;

    vm.authentication = Authentication;
    vm.subaccount = subaccount;

    //Se obtienen los estados existentes.
    vm.stateOptions = StatesService.getStates();
    //Se establece el estado por defecto si es el caso de un alta.
    if(vm.subaccount.id_status === undefined){
      vm.subaccount.id_status = vm.stateOptions[0].id_status;
    }

    //Cuentas para filtrar.
    vm.accountOptions = [];
    var getAccountsFilter = function () {
      AccountsService.query({
        all: true
      }).$promise.then(function(data) {
        vm.accountOptions = data;
        if(vm.subaccount.id_account === undefined){
          vm.subaccount.id_account = vm.accountOptions[0].id_account;
        }
      });
    };
    getAccountsFilter();

    //Funciones y variables varias.
    vm.error = null;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;
    vm.atras = $rootScope.atras;
    vm.go_subaccounts = go_subaccounts;

    function go_subaccounts() {
      $state.go('subaccounts.list');
    }

    // Remove existing Subaccount
    function remove() {
      if (confirm('¿Está seguro que desea dar de baja a esta subcuenta?')) {
        vm.subaccount.$remove($state.go('subaccounts.list'));
      }
    }

    // Save Subaccount
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.subaccountForm');
        return false;
      }

      // TODO: move create/update logic to service
      if (vm.subaccount.id_subaccount) {
        vm.subaccount.$update(successCallback, errorCallback);
      } else {
        vm.subaccount.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        $state.go('subaccounts.view', {
          id_subaccount: res.id_subaccount
        });
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }
  }
})();
