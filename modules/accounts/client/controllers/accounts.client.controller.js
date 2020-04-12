(function () {
  'use strict';

  // Cuentas controller
  angular
    .module('accounts')
    .controller('AccountsController', AccountsController);

  AccountsController.$inject = ['$scope', '$rootScope', '$state', 'Authentication', 'cuentaResolve', 'StatesService'];

  function AccountsController ($scope, $rootScope, $state, Authentication, account, StatesService) {
    var vm = this;

    vm.authentication = Authentication;
    vm.account = account;

    //Obtengo los estados existentes.
    vm.stateOptions = StatesService.getStates();
    //Se establece el estado por defecto si es el caso de un alta.
    if(vm.account.id_status === undefined){
      vm.account.id_status = vm.stateOptions[0].id_status;
    }

    //Obtengo los tipos de cuenta existentes.
    vm.accountTypeOptions = StatesService.getAccountTypes();
    //Se establece el estado por defecto si es el caso de un alta.
    if(vm.account.account_type === undefined){
      vm.account.account_type = vm.accountTypeOptions[0].account_type;
    }

    //Funciones y variables varias.
    vm.error = null;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;
    vm.atras = $rootScope.atras;
    vm.go_accounts = go_accounts;

    // Go to list of accounts.
    function go_accounts() {
      $state.go('accounts.list');
    }

    // Remove existing Cuenta
    function remove() {
      if (confirm('¿Está seguro que quiere dar de baja a este cuenta?')) {
        vm.account.$remove($state.go('accounts.list'));
      }
    }

    // Save Cuenta
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.cuentaForm');
        return false;
      }

      // TODO: move create/update logic to service
      if (vm.account.id_account) {
        vm.account.$update(successCallback, errorCallback);
      } else {
        vm.account.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        $state.go('accounts.view', {
          id_account: res.id_account
        });
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }
  }
})();
