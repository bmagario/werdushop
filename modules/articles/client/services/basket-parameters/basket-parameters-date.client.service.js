//Basket service used to communicate Basket REST endpoints
(function () {
  'use strict';
  angular.module('articles')

  .factory('ShippingDateService', ['$resource', function ($resource) {
    var url, defaultParams, actions;
    url = '/api/basket_params/:shippingDatesId/';
    defaultParams = { shippingDatesId: '@id_shipping_date' };
    actions = {
      getShippingDates: { url: '/api/basket_params/shipping_dates', method: 'GET', isArray: true },
      listShippingDates: { url: '/api/basket_params/list_shipping_dates', method: 'GET', isArray: false },
      addShippingDate: { url: '/api/basket_params/shipping_dates/add', method: 'POST', isArray: true },
      updateShippingDate: { url: '/api/basket_params/shipping_dates/update', method: 'POST', isArray: true },
      deleteShippingDate: { url: '/api/basket_params/shipping_dates/delete', method: 'POST', isArray: true },
      enableShippingDate: { url: '/api/basket_params/shipping_dates/enable', method: 'POST', isArray: false },
      disableShippingDate: { url: '/api/basket_params/shipping_dates/disable', method: 'POST', isArray: false }
    };
    return $resource(url, defaultParams, actions);
  }])//ShippingDateService
  
  .factory('BasketPDateService', ['BasketParametersService', 'NotWorkDatesService', 'ShippingDateService', '$q', 'Authentication', function(BasketParametersService, NotWorkDatesService, ShippingDateService, $q, Authentication){
    var authentication = Authentication;
    var servicio = {};

    servicio.dates = []; //obtenerDiasEntrega();
    servicio.obtenerDiasEntregaHabilitados = function(id_location, id_zone){
      if(authentication.user) {
        var dateOptions = { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' };
        var date_basket = new Date();
        //console.log(date);
        for (var i = 0; i <= 6; i++) {
          //console.log(date.getDay());
          if (date_basket.getDay() !== 0 && date_basket.getDay() !== 6 && !NotWorkDatesService.esFeriado(date_basket)) {
            //servicio.dates.push(date.toLocaleDateString());//Si no es domingo, lo agrego a la lista de dias posibles de entrega
            servicio.dates.push({ date_mysql: date_basket, date_show: date_basket.toLocaleString('es-AR', dateOptions) });
          }
          date_basket.setDate(date_basket.getDate()+1);
          //console.log(date_basket);
          
        }//for
     // return servicio.dates;
      }
    };
    //obtenerDiasEntregaHabilitados(1, 1);

    servicio.listarDiasEntrega = function(ajax_params){
      if(authentication.user) {
        var deferred = $q.defer();    
        ShippingDateService
        .listShippingDates(ajax_params)            
        .$promise.then(function (result) {
          deferred.resolve(result);
          return;
        }, function (error) {
          deferred.reject(error);
          return;
        });
        return deferred.promise;
      }
    };

    servicio.cambiarEstadoDiasEntrega = function(shipping_dates, enable){
      if(authentication.user) {
        var deferred = $q.defer();
        var ajax_params = { 
          shipping_dates: shipping_dates
        };

        if(enable){   
          ShippingDateService
          .enableShippingDate(ajax_params)            
          .$promise.then(function (result) {
            deferred.resolve(result);
            return;
          }, function (error) {
            deferred.reject(error);
            return;
          });
          return deferred.promise;
        } else {

          ShippingDateService
          .disableShippingDate(ajax_params)            
          .$promise.then(function (result) {
            deferred.resolve(result);
            return;
          }, function (error) {
            deferred.reject(error);
            return;
          });
          return deferred.promise;
          
        }
      }
    };

    return servicio;
    
  }]);//BasketParametersDateService
})();
