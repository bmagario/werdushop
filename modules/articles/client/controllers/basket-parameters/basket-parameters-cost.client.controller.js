'use strict';

angular.module('articles')
.controller('BasketParametersCostController', ['$scope', '$state', 'BasketPService', 'BasketPCostService', 'sweet', function BasketController ($scope, $state, BasketPService, BasketPCostService, sweet){
  $scope.basketPS = BasketPService;
  $scope.basketPCostS = BasketPCostService;
  
  var self = this;

  var reloadShippingCost = function(id_zone, id_location){
    /*$scope.basketPCostS.reloadCostosEnvio();*/
    BasketPCostService.listar_CostosEnvio(id_zone, id_location);
    BasketPCostService.obtenerCostosEnvio(1, 1);
  };

  //Filtros de las zonas.
  $scope.changeZone = function(){
    var id_location = $scope.basketPS.selected_zone_loc.id_location;
    var id_zone = $scope.basketPS.selected_zone_loc.id_zone;

    BasketPService.cargarZonaLocalidad(id_location, id_zone);
    reloadShippingCost(id_zone, id_location);
    console.log('changeZone: id_shipping_conditions');console.log($scope.basketPCostS.id_shipping_conditions);
  };

  var getZoneFilter = function () {
    BasketPService.getZoneFilter();
    
    var id_location = $scope.basketPS.selected_zone_loc.id_location;
    var id_zone = $scope.basketPS.selected_zone_loc.id_zone;

    BasketPService.cargarZonaLocalidad(id_location, id_zone);
    reloadShippingCost(id_zone, id_location);

    console.log('getZoneFilter');console.log($scope.basketPS);
  };
  getZoneFilter();

  //Cost
  $scope.updateShippingCost = function(isValid) {
    $scope.success = $scope.error = null;

    if (!isValid) {
      $scope.$broadcast('show-errors-check-validity', 'shippingCostForm');
      return false;
    }
    var id_location = $scope.basketPS.selected_zone_loc.id_location;
    var id_zone = $scope.basketPS.selected_zone_loc.id_zone;

    BasketPCostService
    .actualizarCostosEnvio(id_zone, id_location)
    .then(function(result) {
      if(result.error){
        sweet.show(result.msg);
      }
      reloadShippingCost(id_zone, id_location);
    });
  };
}]);