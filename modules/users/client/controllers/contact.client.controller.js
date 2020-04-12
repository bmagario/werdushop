(function () {
  'use strict';
  angular
  .module('users')
  .controller('ContactController', ContactController);

  ContactController.$inject = ['$scope', 'Authentication', 'ContactService', 'sweet', 'modalService'];

  function ContactController($scope, Authentication, ContactService, sweet, modalService) {
    $scope.authentication = Authentication;
    $scope.sendContact = function(){
      if ($scope.contactForm.$invalid === true) {
        return;
      }

      ContactService
      .sendContact($scope.contact)
      .$promise.then(function (result) {
        if(result[0].error){
          sweet.show({
            title: 'Ocurrió un error. ',
            text: 'Por favor intente nuevamente.',
            animation: 'slide-from-top'
          });
        } else{
          sweet.show({
            title: 'Consulta enviada',
            text: 'Tu consulta ha sido enviada satisfactoriamente.',
            animation: 'slide-from-top'
          });
        }
      }, function(error) {
        console.log(error);
      });
    };
  }
})();
