(function () {
  'use strict';

  // Providers controller
  angular
    .module('providers')
    .controller('ProvidersController', ProvidersController);

  ProvidersController.$inject = ['$scope', '$rootScope', '$state', 'Authentication', 'providerResolve', 'StatesService'];

  function ProvidersController ($scope, $rootScope, $state, Authentication, provider, StatesService) {
    var vm = this;

    vm.authentication = Authentication;
    vm.provider = provider;

    //Obtengo los estados existentes.
    vm.stateOptions = StatesService.getStates();
    //Se establece el estado por defecto si es el caso de un alta.
    if(vm.provider.id_status === undefined){
      vm.provider.id_status = vm.stateOptions[0].id_status;
    }

    //Funciones y variables varias.
    vm.error = null;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;
    vm.atras = $rootScope.atras;
    vm.go_providers = go_providers;

    // Go to list of providers.
    function go_providers() {
      $state.go('providers.list');
    }

    // Remove existing Provider
    function remove() {
      if (confirm('¿Está seguro que quiere dar de baja a este proveedor?')) {
        vm.provider.$remove($state.go('providers.list'));
      }
    }

    // Save Provider
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.providerForm');
        return false;
      }

      // TODO: move create/update logic to service
      if (vm.provider.id_provider) {
        vm.provider.$update(successCallback, errorCallback);
      } else {
        vm.provider.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        $state.go('providers.view', {
          id_provider: res.id_provider
        });
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }
  }
})();
