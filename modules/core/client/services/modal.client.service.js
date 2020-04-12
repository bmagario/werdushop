'use strict';
angular.module('core').service('modalService', ['$modal', function ($modal) {

  var modalDefaults = {
    backdrop: false,
    backdropClick: true,
    dialogFade: false,
    keyboard: true,
    modalFade: true,
    templateUrl: '/modules/core/client/views/modal.client.view.html',
    controller: '',
    size: ''
  };

  var modalOptions = {
    closeButtonText: 'Cerrar',
    actionButtonText: 'Aceptar',
    headerText: '¡Werdulero!',
    bodyUrl: '',
    bodyText: '',
    footerText: ''
  };

  this.showModal = function (customModalDefaults, customModalOptions) {
    if (!customModalDefaults) customModalDefaults = {};
    /*customModalDefaults.backdrop = 'static';*//*si saco esto, puedo cerrar el modal haciendo clic fuera*/
    return this.show(customModalDefaults, customModalOptions);
  };

  this.show = function (customModalDefaults, customModalOptions) {
    //Create temp objects to work with since we're in a singleton service
    var tempModalDefaults = {};
    var tempModalOptions = {};

    //Map angular-ui modal custom defaults to modal defaults defined in service
    angular.extend(tempModalDefaults, modalDefaults, customModalDefaults);

    //Map modal.html $scope custom properties to defaults defined in service
    angular.extend(tempModalOptions, modalOptions, customModalOptions);

    if (!tempModalDefaults.controller) {
      tempModalDefaults.controller = function ($scope, $modalInstance) {

        $scope.modalOptions = tempModalOptions;

        $scope.modalOptions.ok = function (result) {
          $modalInstance.close(result);
        };

        $scope.modalOptions.close = function (result) {
          $modalInstance.dismiss('cancel');
        };
      };
    }
    return $modal.open(tempModalDefaults).result;
  };
}]);
