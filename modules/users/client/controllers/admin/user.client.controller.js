'use strict';

angular.module('users.admin').controller('UserController', ['$scope', '$rootScope', '$state', 'Authentication', 'userResolve', 'StatesService',
  function ($scope, $rootScope, $state, Authentication, userResolve, StatesService) {
    $scope.authentication = Authentication;
    $scope.user = userResolve;
    $scope.stateOptions = StatesService.getStates();
    $scope.atras = $rootScope.atras;
    $scope.go_usuarios = go_usuarios;

    //Ir al listado de usuarios.
    function go_usuarios() {
      $state.go('admin.users');
    }

    $scope.remove = function (user) {
      if (confirm('¿Está seguro de que desea dar de baja a este usuario?')) {
        if (user) {
          user.$remove();

          $scope.users.splice($scope.users.indexOf(user), 1);
        } else {
          $scope.user.$remove(function () {
            $state.go('admin.users');
          });
        }
      }
    };

    $scope.update = function (isValid) {
      if (!isValid) {
        $scope.$broadcast('show-errors-check-validity', 'userForm');
        return false;
      }

      var user = $scope.user;
      user.$update(function () {
        $state.go('admin.user', {
          idUser: user.id_user
        });
      }, function (errorResponse) {
        $scope.error = errorResponse.data.message;
      });
    };
  }
]);