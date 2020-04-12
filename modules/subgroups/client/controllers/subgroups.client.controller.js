(function () {
  'use strict';

  // Subgroups controller
  angular
    .module('subgroups')
    .controller('SubgroupsController', SubgroupsController);

  SubgroupsController.$inject = ['$scope', '$rootScope', '$state', 'Authentication', 'subgroupResolve', 'GroupsService', 'StatesService'];

  function SubgroupsController ($scope, $rootScope, $state, Authentication, subgroup, GroupsService, StatesService) {
    var vm = this;

    vm.authentication = Authentication;
    vm.subgroup = subgroup;

    //Se obtienen los estados existentes.
    vm.stateOptions = StatesService.getStates();
    //Se establece el estado por defecto si es el caso de un alta.
    if(vm.subgroup.id_status === undefined){
      vm.subgroup.id_status = vm.stateOptions[0].id_status;
    }

    //Grupos para filtrar.
    vm.groupOptions = [];
    var getGroupsFilter = function () {
      GroupsService.query({
        all: true
      }).$promise.then(function(data) {
        vm.groupOptions = data;
        //Se establece el grupo por defecto si es el caso de un alta.
        if(vm.subgroup.id_group === undefined){
          vm.subgroup.id_group = vm.groupOptions[0].id_group;
        }
      });
    };
    getGroupsFilter();

    //Funciones y variables varias.
    vm.error = null;
    vm.form = {};
    vm.remove = remove;
    vm.save = save;
    vm.atras = $rootScope.atras;
    vm.go_subgrupos = go_subgrupos;

    function go_subgrupos() {
      $state.go('subgroups.list');
    }

    // Remove existing Subgroup
    function remove() {
      if (confirm('¿Está seguro que desea dar de baja a este subgrupo?')) {
        vm.subgroup.$remove($state.go('subgroups.list'));
      }
    }

    // Save Subgroup
    function save(isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'vm.form.subgroupForm');
        return false;
      }

      // TODO: move create/update logic to service
      if (vm.subgroup.id_subgroup) {
        vm.subgroup.$update(successCallback, errorCallback);
      } else {
        vm.subgroup.$save(successCallback, errorCallback);
      }

      function successCallback(res) {
        $state.go('subgroups.view', {
          subgroupId: res.id_subgroup
        });
      }

      function errorCallback(res) {
        vm.error = res.data.message;
      }
    }
  }
})();
