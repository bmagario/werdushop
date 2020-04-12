'use strict';
angular.module('core')
.controller('HeaderController', ['$scope', '$state', 'Authentication', 'BasketService', 'Menus', 'modalService',
function ($scope, $state, Authentication, BasketService, Menus, modalService){
  console.log('HEADER CONTROLLER');

  // Expose view variables
  $scope.$state = $state;
  $scope.authentication = Authentication;
  $scope.basketS = BasketService;


  $scope.canastaPopover = {
    content: 'Hello, World!',
    templateUrl: '/modules/articles/client/views/basket-articles.client.view.html',
    title: 'Tu compra'
  };

  $scope.imghomeinit = '/modules/core/client/img/brand/favicon.ico';
  $scope.tpagina = 'werdulero';

  $scope.bdudasconsultas = '¿Dudas, consultas?';

  $scope.bingresar = 'Cargá tu canasta';

  $scope.blogout = 'Salir';
  $scope.teditardatospropios = 'Editar perfil';
  $scope.tcambiarclave = 'Cambiar contraseña';
  $scope.tcambiardomicilio = 'Actualizar domicilio';

  // Get the topbar menu
  $scope.menu = Menus.getMenu('topbar');

  //Texto para botones del header
  $scope.tabs = [{ 'titulo': 'Frutas', 'url':'home.frutas', 'active': false },
                { 'titulo': 'Verduras', 'url':'home.verduras', 'active': false },
                { 'titulo': 'Promociones', 'url':'home.combos', 'active': false },
                { 'titulo': 'Recetas', 'url':'home.recetas', 'active': false },
                { 'titulo': 'Ensaladas', 'url':'home.ensaladas', 'active': false }];

  $scope.goHome = function () {
    var tabs = $scope.tabs;
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].active = false;
    }
    $scope.tabs = tabs;
  };
  /*vm.accountMenu = menuService.getMenu('account').items[0];*/

  // Toggle the menu items
  $scope.isCollapsed = false;

// Get the topbar menu
//    $scope.menu = Menus.getMenu('topbar');

  $scope.toggleCollapsibleMenu = function () {
    $scope.isCollapsed = !$scope.isCollapsed;
  };

  // Collapsing the menu after navigation
  $scope.$on('$stateChangeSuccess', function () {
    $scope.isCollapsed = false;
  });

 // $scope.price = $scope.basketS.precioTotalCanasta;
/*   $scope.precioTotalCanasta = function() {

    console.log('CHC001>Controller HEADER obteniendo el costo total de la canasta del usuario..');

    if ($scope.authentication.user) {
      $scope.price = $scope.basketS.precioTotalCanasta();
    }

  };*/

  $scope.verDudasConsultas = function () {
    var modalOptions = {
      closeButtonText: 'Cerrar',
      actionButtonText: 'Enviar',
      headerText: 'Envianos tu consulta!',
      bodyText: ' ',
      footerText: 'Te contacteremos lo antes posible',
      bodyUrl: 'modules/core/client/views/dudas-consultas.client.view.html'
    };

    var modalDefaults = {
      backdrop: true,
      keyboard: true,
      modalFade: true,
      templateUrl: '/modules/core/client/views/modal.client.view.html',
      size: 'lg'
    };

    modalService.showModal(modalDefaults, modalOptions);
  };

  $scope.verIngreso = function() {
    if (!$scope.authentication.user) {
      var modalOptions = {
        closeButtonText: 'Cerrar',
        actionButtonText: 'Aceptar',
        headerText: 'Visitá la werdulería!',
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
    }
  };
}])

.directive('scrollNav', function ($window) {

  var maxOffset = screen.height/8;

  return function($scope, element, attrs) {
    angular.element($window).bind('scroll', function() {
      $scope.scrollDown = (this.pageYOffset >= maxOffset);
      $scope.$apply();
    });
  };
});
