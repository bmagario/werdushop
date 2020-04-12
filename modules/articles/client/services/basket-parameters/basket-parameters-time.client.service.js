//Basket service used to communicate Basket REST endpoints
(function () {
  'use strict';
  angular.module('articles')

  .factory('ShippingTimeService', ['$resource', function ($resource) {
    var url, defaultParams, actions;
    url = '/api/basket_params/:shippingTimesId/';
    defaultParams = { shippingTimesId: '@id_shipping_time' };
    actions = {
      listShippingTimes: { url: '/api/basket_params/list_shipping_times', method: 'GET', isArray: false },
      addShippingTime: { url: '/api/basket_params/shipping_times/add', method: 'POST', isArray: true },
      updateShippingTime: { url: '/api/basket_params/shipping_times/update', method: 'POST', isArray: true },
      deleteShippingTime: { url: '/api/basket_params/shipping_times/delete', method: 'POST', isArray: true },
      enableShippingTime: { url: '/api/basket_params/shipping_times/enable', method: 'POST', isArray: false },
      disableShippingTime: { url: '/api/basket_params/shipping_times/disable', method: 'POST', isArray: false }
      /*disableShippingTime: { url: '/api/basket_params/shipping_times/:shippingTimesId/disable', method: 'POST', isArray: false }*/
    };
    return $resource(url, defaultParams, actions);
  }])//ShippingTimeService

  .factory('BasketPTimeService', ['BasketParametersService', 'ShippingTimeService', '$q', 'Authentication', function(BasketParametersService, ShippingTimeService, $q, Authentication){
    var authentication = Authentication;
    var servicio = {};

    //transforma el string en Date
    servicio.toTime = function(timeString){
      var timeTokens = timeString.split(':');
      return new Date(1970,0,1, timeTokens[0], timeTokens[1], timeTokens[2]);
    };

    servicio.pasarHoraString = function(hour){
      var h = hour.getHours().toString();
      if(hour.getHours() <= 9) {
        h = '0'+hour.getHours().toString();
      }

      var m = hour.getMinutes().toString();
      if(hour.getMinutes() <= 9) {
        m = '0'+hour.getMinutes().toString();
      }

      return h+':'+m;
    };

    //Datos para la entrega (dirección, día y horario)
    servicio.hour = [];
    servicio.obtenerHorariosEntrega = function(id_location, id_zone){
      servicio.hour = [];
      if(authentication.user) {
        var deferred = $q.defer();
        
        var ajax_params = {
          id_location: id_location,
          id_zone: id_zone
        };

        BasketParametersService
        .getShippingTimes(ajax_params)            
        .$promise.then(function (result) {

          angular.forEach(result[0], function(item) {
            if (angular.isDefined(item.shipping_hour_from) && angular.isDefined(item.shipping_hour_to)) {
              var hour_to_show = 'entre las '+item.shipping_hour_from + ' y las '+ item.shipping_hour_to;
              servicio.hour.push({ hour_all: item, hour_show: hour_to_show });
            }
          });
        
        }, function (error) {
          console.log('ERROR al obtenerHorariosEntrega: '+ error);
          deferred.reject(error);
   
        });
        return deferred.promise;
      }
    };

    servicio.listarHorariosEntrega = function(ajax_params){
      if(authentication.user) {
        var deferred = $q.defer();    
        ShippingTimeService
        .listShippingTimes(ajax_params)            
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

    servicio.cambiarEstadoHorarioEntrega = function(shipping_times, enable){
      if(authentication.user) {
        var deferred = $q.defer();
        var ajax_params = { 
          shipping_times: shipping_times 
        };

        if(enable){
          ShippingTimeService
          .enableShippingTime(ajax_params)            
          .$promise.then(function (result) {
            deferred.resolve(result);
            return;
          }, function (error) {
            deferred.reject(error);
            return;
          });
          return deferred.promise;
        } else {
          ShippingTimeService
          .disableShippingTime(ajax_params)            
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

    servicio.agregarHorarioEntrega = function(shipping_hour_from, shipping_hour_to, id_location, id_zone, id_status){
      if(authentication.user) {
        var deferred = $q.defer();
        var ajax_params = {
          shipping_hour_from: shipping_hour_from,
          shipping_hour_to: shipping_hour_to,
          id_location: id_location,
          id_zone: id_zone,
          id_status: id_status
        };

        ShippingTimeService
        .addShippingTime(ajax_params)            
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
    
    servicio.eliminarHorarioEntrega = function(shipping_times){
      if(authentication.user) {
        var deferred = $q.defer();
        var ajax_params = {
          shipping_times: shipping_times 
        };

        ShippingTimeService
        .deleteShippingTime(ajax_params)            
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

    servicio.actualizarHorarioEntrega = function(shipping_times){
      if(authentication.user) {
        var deferred = $q.defer();
        var ajax_params = {
          shipping_times: shipping_times 
        };

        ShippingTimeService
        .updateShippingTime(ajax_params)            
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

    return servicio;
    
  }]);//BasketService
})();
