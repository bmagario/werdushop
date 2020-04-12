(function () {
  'use strict';

  // Groups controller
  angular
    .module('groups')
    .controller('GroupsController', GroupsController);

  GroupsController.$inject = ['$scope', '$rootScope', '$state', 'Authentication', 'groupResolve', 'StatesService'];

  function GroupsController ($scope, $rootScope, $state, Authentication, group, StatesService) {
    var vm = this;

    vm.authentication = Authentication;
    vm.group = group;
    //Chequeo por el estado actual (template actual), si no se rompe.
/*    if(!$state.current.name.includes('view')){
      if(vm.group.id_group !== undefined){
        vm.group.id_status = vm.group.id_status;
      }
    }*/

    //Obtengo los estados existentes.
    vm.stateOptions = StatesService.getStates();
    //Se establece el estado por defecto si es el caso de un alta.
    if(vm.group.id_status === undefined){
      vm.group.id_status = vm.stateOptions[0].id_status;
    }

    //Funciones y variables varias.
    vm.error = null;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;
    vm.atras = $rootScope.atras;
    vm.go_grupos = go_grupos;

    // Go to list of groups.
    function go_grupos() {
      $state.go('groups.list');
    }

    // Remove existing Group
    function remove() {
      if (confirm('¿Está seguro que quiere dar de baja a este grupo?')) {
        vm.group.$remove($state.go('groups.list'));
      }
    }

    // Save Group
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.groupForm');
        return false;
      }

      // TODO: move create/update logic to service
      if (vm.group.id_group) {
        console.log(vm.group.id_group);
        vm.group.$update(successCallback, errorCallback);
      } else {
        vm.group.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        $state.go('groups.view', {
          groupId: res.id_group
        });
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }
  }
})();