(function () {
  'use strict';
  angular.module('core')
  .factory('LocationsService', ['$resource', '$q', function($resource, $q){

    var url, defaultParams, actions;

    url = '';

    defaultParams = {};

    actions = {
      getLocations: { url: '/api/locations/', method: 'GET', isArray: true },
      getNameLocation: { url: '/api/locations/get_name_location/', method: 'GET', isArray: false }
    };

    var recurso = $resource(url, defaultParams, actions);

    var locationsService = {};

    locationsService.getLocations = function(){
      var deferred = $q.defer();
      recurso.getLocations({}).$promise.then(function (result) {
        deferred.resolve(result);
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise;
    };
   
    locationsService.getNameLocation = function(id_location){
      var deferred = $q.defer();    
      if(id_location !== null || id_location !== undefined) {

        var ajax_params = {
          id_location: id_location     
        };

        recurso.getNameLocation(ajax_params).$promise.then(function (result) {
          deferred.resolve(result.location_name[0].name);          
        }, function (error) {
          deferred.reject(error);
        });
      }
      return deferred.promise;
    };


    return locationsService;

  }]);
})();
