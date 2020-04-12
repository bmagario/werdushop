//Basket service used to communicate Basket REST endpoints
(function () {
  'use strict';
  angular.module('articles')

  .factory('ShippingCostService', ['$resource', function ($resource) {
    var url, defaultParams, actions;
    url = '/api/basket_params/:shippingCostsId/';
    defaultParams = { shippingCostsId: '@id_shipping_cost' };
    actions = {
      listShippingCosts: { url: '/api/basket_params/list_shipping_costs', method: 'GET', isArray: true },
      updateShippingCosts: { url: '/api/basket_params/shipping_conditions/update', method: 'POST', isArray: true }
    };
    return $resource(url, defaultParams, actions);
  }])//ShippingCostService

  .factory('BasketPCostService', ['BasketParametersService', 'ShippingCostService', '$q', 'sweet', 'Authentication', function(BasketParametersService, ShippingCostService, $q, sweet, Authentication){
    var authentication = Authentication;
    var servicio = {};

    servicio.minimun_purchase_basket = 0;
    servicio.free_shipping_basket = 0;
    servicio.shipping_cost_basket = 0;
    
    servicio.obtenerCostosEnvio = function(id_location, id_zone){
      if(authentication.user) {
        var deferred = $q.defer();    
        var ajax_params = {
          id_zone: id_zone,
          id_location: id_location
        };
        BasketParametersService
        .getShippingConditions(ajax_params)             
        .$promise.then(function (result) {
          servicio.minimun_purchase_basket = result[0].minimun_purchase;
          servicio.free_shipping_basket = result[0].free_shipping;
          servicio.shipping_cost_basket = result[0].shipping_cost;
          deferred.resolve(result);
          return;
        }, function (error) {
          deferred.reject(error);
          return;
        });
        return deferred.promise;
      }
    };

    servicio.listar_CostosEnvio = function(id_zone, id_location) {
      if(authentication.user){
        if (id_zone !== null && id_zone !== undefined && id_location !== null && id_location !== undefined) {
          var ajax_params = {
            id_zone: id_zone,
            id_location: id_location
          };

          var deferred = $q.defer();    
          
          ShippingCostService
          .listShippingCosts(ajax_params)            
          .$promise.then(function (result) {
            deferred.resolve(result);
            if(result !== null && result !== undefined && result[0] !== null && result[0] !== undefined){
              servicio.minimun_purchase = result[0].minimun_purchase;
              servicio.free_shipping = result[0].free_shipping;
              servicio.shipping_cost = result[0].shipping_cost;
              servicio.id_shipping_conditions = result[0].id_shipping_conditions;
              /*servicio.obtenerCostosEnvio(1, 1);*/
            } else {
              servicio.minimun_purchase = 0;
              servicio.free_shipping = 0;
              servicio.shipping_cost = 0;
              servicio.id_shipping_conditions = null;
            }
            return;
          }, function (error) {
            deferred.reject(error);
            return;
          });
          return deferred.promise;
        } else{
          sweet.show('Error al listar los parámetros de costos > no se pudo obtener la localidad y zona');
        }
      } else{
        sweet.show('Error al listar los parámetros de costos > debe estar logueado');
      }
    };

    servicio.actualizarCostosEnvio = function(id_zone, id_location){
      if(authentication.user) {
  
        var deferred = $q.defer();    

        var ajax_params = {
          id_location: id_location,
          id_zone: id_zone,
          id_shipping_conditions: servicio.id_shipping_conditions,
          shipping_cost: servicio.shipping_cost,
          free_shipping: servicio.free_shipping,
          minimun_purchase: servicio.minimun_purchase
        };
  
        ShippingCostService
        .updateShippingCosts(ajax_params)            
        .$promise.then(function (result) {
          deferred.resolve(result);
          if(result !== null && result !== undefined && result[0] !== null && result[0] !== undefined){
            servicio.minimun_purchase = result[0].minimun_purchase;
            servicio.free_shipping = result[0].free_shipping;
            servicio.shipping_cost = result[0].shipping_cost;
            servicio.id_shipping_conditions = result[0].id_shipping_conditions;
          } else {
            servicio.minimun_purchase = 0;
            servicio.free_shipping = 0;
            servicio.shipping_cost = 0;
            servicio.id_shipping_conditions = null;
          }
          return;
        }, function (error) {
          deferred.reject(error);
          return;
        });
        return deferred.promise;
      }
    };

    return servicio;
    
  }])//BasketService

.filter('formatoMoneda', function() {
  return function(input) {
    var out = '';
    var valor = 0;
    if(input !== null && input !== undefined) valor = parseFloat(input);
    out = '$' + Math.floor(valor) + '.' + ((valor * 100) % 100 + '00').substr(0,2);
    return out;
  };
});
})();
