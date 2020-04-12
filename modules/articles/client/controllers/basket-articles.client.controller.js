'use strict';

angular.module('articles')
.controller('BasketController', ['$scope', 'BasketService', 'GondolaService', function BasketController ($scope, BasketService, GondolaService){
    
  $scope.basketS = BasketService;
  $scope.detalle_entrega_expandido = false;
    
  $scope.$watch('detalle_entrega_expandido', function () {
    $scope.$parent.detalle_entrega_expandido = !$scope.$parent.detalle_entrega_expandido;
  });

  $scope.listar = function() {
    return $scope.basketS.listar();
  };

  $scope.quitarArticulo = function(articulo) {
    $scope.basketS.quitar(articulo, 1);
    GondolaService.botones(articulo, 1);
  };

  $scope.agregarArticulo = function(articulo) {
    $scope.basketS.agregar(articulo, 1);
  };

  $scope.eliminarArticulo = function(articulo) {
    $scope.basketS.eliminar(articulo);
  };  

  $scope.cerrarCanasta = function() {
    $scope.basketS.mostrarResumenDeCompra();    
  };

  $scope.calcularPrecioArticulo = function(articulo) {
    if(articulo !== null && articulo !== undefined) return(articulo.amount * articulo.price);
    else return 0;
  };

  $scope.calcularUnidadesArticulo = function(articulo) {
    return $scope.basketS.calcularUnidadesArticulo(articulo);
  };

  $scope.calcularAbrUnidadMedida = function(articulo) {   
    var abr_unidad_medida = $scope.basketS.calcularAbrUnidadMedida(articulo);
    return abr_unidad_medida;
  };


}]);