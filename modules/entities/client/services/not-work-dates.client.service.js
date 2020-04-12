(function () {
  'use strict';
  angular.module('core')
  .factory('Not_Work_DatesService', ['$resource', function ($resource) {
    var url, defaultParams, actions;
    url = '';
    defaultParams = {};
    actions = {
      getNotWorkDates: { url: '/api/get_not_work_dates/', method: 'GET', isArray: true },
      addNotWorkDates: { url: '/api/add_not_work_dates/', method: 'POST', isArray: true },
      deleteNotWorkDates: { url: '/api/delete_all_not_work_dates/', method: 'POST', isArray: true }
    };
    return $resource(url, defaultParams, actions);
   }])//Not_Work_DatesService

  .factory('NotWorkDatesService', ['Not_Work_DatesService', '$q', '$timeout', 'Authentication', function(Not_Work_DatesService, $q, $timeout, Authentication){
    
    var authentication = Authentication;
    var servicio = {};

    servicio.feriados = [];
    servicio.obtenerDiasNoLaborales = function(id_location, id_zone){
      servicio.feriados = [];
      if(authentication.user && id_location !== undefined && id_location !== null && id_zone !== undefined && id_zone !== null ) {
        
        var deferred = $q.defer();
        var ajax_params = { id_location: id_location, id_zone: id_zone };

        Not_Work_DatesService.getNotWorkDates(ajax_params)
        .$promise.then(function (result) {

          angular.forEach(result[0], function(item) {
            if (angular.isDefined(item.day)) {
              servicio.feriados.push(item.day);
            }
          });

          //deferred.resolve(result);
        }, function(error) {
          deferred.reject(error);
        });
        console.log('Not Work Dates Service: servicio.feriados');
        console.log(servicio.feriados);
        return deferred.promise;
      }
    };

    servicio.agregarDiasNoLaborales = function(id_location, id_zone, not_work_days){
      if(authentication.user) {
        var deferred = $q.defer();
        var ajax_params = {
          not_work_days: not_work_days,
          id_location: id_location,
          id_zone: id_zone          
        };
        
        Not_Work_DatesService
        .deleteNotWorkDates(ajax_params).$promise.then(function (result) {
            Not_Work_DatesService
            .addNotWorkDates(ajax_params).$promise.then(function (result) {
              deferred.resolve(result);
              return;
            }, function (error) {
              deferred.reject(error);
              return;
            });
    
        }, function (error) {
          deferred.reject(error);
          return;
        });
        return deferred.promise;
      }
    };

    servicio.eliminarDiasNoLaborales = function(id_location, id_zone){
      if(authentication.user) {
        var deferred = $q.defer();
        var ajax_params = {
          id_location: id_location,
          id_zone: id_zone          
        };

         Not_Work_DatesService
         .deleteNotWorkDates(ajax_params).$promise.then(function (result) {
          deferred.resolve(result);
          return;
        }, function (error) {
          deferred.reject(error);
          return;
        });
        return deferred.promise;
      }
    };

    servicio.esFeriado = function(date_basket){
      return (date_basket in servicio.feriados);
    };//esFeriado

    return servicio;
  }]);
})();