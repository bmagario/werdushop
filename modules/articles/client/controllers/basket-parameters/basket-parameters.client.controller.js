'use strict';

angular.module('articles')
.controller('BasketParametersController', ['$scope', 'BasketPService', function BasketController ($scope, BasketPService){
  
  $scope.basketPS = BasketPService;
  
  //Opciones de selección para configuración de parámetros de entrega
  $scope.options = [
    { 'titulo': 'Resumen', 'url':'basket_params.list', 'active': 'active' },
    { 'titulo': 'Días de entrega', 'url':'basket_params.days', 'active': 'active' },
    { 'titulo': 'Horarios de entrega', 'url':'basket_params.times', 'active': 'active' },
    { 'titulo': 'Costos de envío', 'url':'basket_params.shipping_cost', 'active': 'active' }
  ];
}]);