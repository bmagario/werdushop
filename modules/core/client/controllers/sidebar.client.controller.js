'use strict';

angular
  .module('core')
  .controller('SidebarController', ['$scope', '$rootScope', '$state', 'Authentication', 'Menus',
  function ($scope, $rootScope, $state, Authentication, Menus, event) {
  /*  $scope.$state = $state;*/
    $scope.authentication = Authentication;

    // Get the leftbar menu
    $scope.menu = Menus.getMenu('leftbar');
    $scope.opened = false;
    
    $scope.$on('getMenuState', change);
    $rootScope.$on('documentClicked', change);
    $rootScope.$on('escapePressed', change);

    function change() {
      $scope.opened = !$scope.opened; console.log($scope.opened+'adentro');
    }

   /* $scope.state = false;

    $scope.toggleState = function() {
      $scope.state = !$scope.state;
    };*/
  }
]);