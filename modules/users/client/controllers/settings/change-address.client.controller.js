'use strict';

angular.module('users')
.controller('ChangeAddressController', ['$scope', 'AddressService', function ($scope, AddressService) {

  $scope.addressS = AddressService;

  $scope.listar = function() {
    return $scope.addressS.listar();
  }; 
}]);
