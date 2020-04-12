(function () {
  'use strict';
  angular.module('core')
  .factory('ZonesService', ['$resource', '$q', '$timeout', function($resource, $q, $timeout){
    var url, defaultParams, actions;
    url = '';
    defaultParams = {};
    actions = {
      getZones: { url: '/api/zones/', method: 'GET', isArray: true },
      getDeliveryHours: { url: '/api/basket_params/get_shipping_times/', method: 'GET', isArray: true },
      getNameZone: { url: '/api/zones/get_name_zone/', method: 'GET', isArray: false }
    };
    var recurso = $resource(url, defaultParams, actions);

    var zonesService = {};

    zonesService.getZones = function(){
      var deferred = $q.defer();
      recurso.getZones({}).$promise.then(function (result) {
        deferred.resolve(result);
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise;
    };

    zonesService.getDeliveryHours = function (){
      var deferred = $q.defer();
      recurso.getDeliveryHours({}).$promise.then(function (result) {
        deferred.resolve(result);
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise;
    };

    zonesService.getZonesAndDeliveryHours = function(ajax_params){
      var deferred = $q.defer();
      recurso.getZones({}).$promise.then(function(zones){
        recurso.getDeliveryHours(ajax_params).$promise.then(function (deliveryHours) {
          var result = {
            zones: zones,
            deliveryHours: deliveryHours
          };
          deferred.resolve(result);
        }, function(error) {
          deferred.reject(error);
        });
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise;
    };


    zonesService.getNameZone = function(id_zone){

      var deferred = $q.defer();
      if(id_zone !== null || id_zone !== undefined) {
        var ajax_params = {
          id_zone: id_zone
        };

        recurso.getNameZone(ajax_params).$promise.then(function (result) {
          deferred.resolve(result.zone_name[0].name);
        }, function (error) {
          deferred.reject(error);
        });
      }
      return deferred.promise;
    };

    return zonesService;
  }]);
})();
