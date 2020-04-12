'use strict';

angular.module('users')
.controller('AuthenticationController', ['$scope', '$state', '$http', '$location', '$window', 'Authentication', 'PasswordValidator', 'modalService', 'BasketService',
function ($scope, $state, $http, $location, $window, Authentication, PasswordValidator, modalService, BasketService) {
  $scope.tregistrofacebook = 'Ingresar con Facebook';

  $scope.tlogin = '¿Tenés cuenta? Ingresá';
  $scope.temail = 'Email';
  $scope.tclave = 'Contraseña';
  $scope.bingresar = 'Ingresar';
  $scope.tnuevaclave = '¿Olvidaste tu contraseña?';

  $scope.tregistroemail = 'Registrate';

  $scope.thombre = 'Hombre';
  $scope.tmujer = 'Mujer';

  // Defino el valor por defecto para inputType
  $scope.inputType = 'password';
  $scope.tmostrarclave = 'Mostrar contraseña';
  $scope.iconoverpass = 'fa fa-eye';

  $scope.authentication = Authentication;
  $scope.basketS = BasketService;

  $scope.popoverMsg = PasswordValidator.getPopoverMsg();

  // Get an eventual error defined in the URL query string:
  $scope.error = $location.search().err;

  // If user is signed in then redirect back home
  if ($scope.authentication.user) {
    $location.path('/');
  }

  $scope.signup = function (modalOptions, isValid) {
    $scope.error = null;

    if (!isValid) {
      $scope.$broadcast('show-errors-check-validity', 'userForm');
      return false;
    }

    $http.post('/api/auth/signup', $scope.credentials).success(function (response) {
      // If successful we assign the response to the global user model
      $scope.authentication.user = response;
      
      //Cierro el modal
      if (modalOptions !== null && modalOptions !== undefined) { 
        modalOptions.ok();
      }
      
      // And redirect to the previous or home page
      $state.go($state.previous.state.name || 'home', $state.previous.params);
    }).error(function (response) {
      $scope.error = response.message;
    });
  };


  $scope.signin = function (modalOptions, isValid) {
    $scope.error = null;

    if (!isValid) {
      $scope.$broadcast('show-errors-check-validity', 'userForm');
      return false;
    }

    $http.post('/api/auth/signin', $scope.credentials).success(function (response) {
      // If successful we assign the response to the global user model
      $scope.authentication.user = response;

      //Cargo la canasta que pueda tener grabada el usuario
      $scope.basketS.listar();

      //Cierro el modal
      if (modalOptions !== null && modalOptions !== undefined) { 
        modalOptions.ok();
      }
      
      // And redirect to the previous or home page
      $state.go($state.previous.state.name || 'home', $state.previous.params);

    }).error(function (response) {
      $scope.error = response.message;
    });

  };

  // OAuth provider request
  $scope.callOauthProvider = function (url) {
    if ($state.previous && $state.previous.href) {
      url += '?redirect_to=' + encodeURIComponent($state.previous.href);
    }

    // Effectively call OAuth authentication route:
    $window.location.href = url;
  };

  $scope.verLogin = function(modalOptions) {
    if (modalOptions !== null && modalOptions !== undefined) { 
      modalOptions.close();
    }
    modalOptions = {
      closeButtonText: ' ',
      actionButtonText: ' ',
      headerText: '¡Visitá la werdulería!',
      bodyText: ' ',
      bodyUrl: 'modules/users/client/views/authentication/signin.client.view.html'
    };

    var modalDefaults = {
      backdrop: true,
      keyboard: true,
      modalFade: true,
      templateUrl: '/modules/core/client/views/modal.client.view.html',
      size: 'sm'
    };

    modalService.showModal(modalDefaults, modalOptions);
  }; 

  $scope.verRegistro = function(modalOptions) {
    if (modalOptions !== null && modalOptions !== undefined) {
      modalOptions.close();
    }

    modalOptions = {
      closeButtonText: ' ',
      actionButtonText: ' ',
      headerText: '¡Conocé la werdulería!',
      bodyText: ' ',
      bodyUrl: 'modules/users/client/views/authentication/signup.client.view.html'
    };

    var modalDefaults = {
      backdrop: true,
      keyboard: true,
      modalFade: true,
      templateUrl: '/modules/core/client/views/modal.client.view.html',
      size: ''
    };

    modalService.showModal(modalDefaults, modalOptions);
  }; 

  // Función para ocultar y mostrar los caracteres de la contraseña
  $scope.hideShowPassword = function(){
    if ($scope.inputType === 'password') {
      $scope.inputType = 'text';
      $scope.tmostrarclave = 'Ocultar contraseña';
      $scope.iconoverpass = 'fa fa-eye-slash';
    } else {
      $scope.inputType = 'password';
      $scope.tmostrarclave = 'Mostrar contraseña';
      $scope.iconoverpass = 'fa fa-eye';
    }
  };

}]);