(function () {
  'use strict';

  // Brands controller
  angular
    .module('brands')
    .controller('BrandsController', BrandsController);

  BrandsController.$inject = ['$scope', '$rootScope', '$state', 'Authentication', 'brandResolve', 'StatesService'];

  function BrandsController ($scope, $rootScope, $state, Authentication, brand, StatesService) {
    var vm = this;

    vm.authentication = Authentication;
    vm.brand = brand;
    vm.error = null;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;
    vm.atras = $rootScope.atras;
    vm.go_marcas = go_marcas;
    
    //Chequeo por el estado actual (template actual), si no se rompe.
    if(!$state.current.name.includes('view')){
      if(vm.brand.id_brand !== undefined){
        vm.brand.id_status = vm.brand.id_status;
      }
    }
    //Se obtienen los estados existentes.
    vm.stateOptions = StatesService.getStates();
    //Se establece el estado por defecto si es el caso de un alta.
    if(vm.brand.id_status === undefined){
      vm.brand.id_status = vm.stateOptions[0].id_status;
    }

    //Ir al listado de marcas.
    function go_marcas() {
      $state.go('brands.list');
    }

    // Remove existing Brand
    function remove() {
      if (confirm('¿Está seguro que desea dar de baja esta marca?')) {
        vm.brand.$remove($state.go('brands.list'));
      }
    }

    // Save Brand
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.brandForm');
        return false;
      }

      // TODO: move create/update logic to service
      if (vm.brand.id_brand) {
        vm.brand.$update(successCallback, errorCallback);
      } else {
        vm.brand.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        $state.go('brands.view', {
          brandId: res.id_brand
        });
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }
  }
})();