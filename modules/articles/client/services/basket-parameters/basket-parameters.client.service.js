//Basket service used to communicate Basket REST endpoints
(function () {
  'use strict';
  angular.module('articles')

  .factory('BasketParametersService', ['$resource', function ($resource) {
    var url, defaultParams, actions;
    url = '';
    defaultParams = {};
    actions = {
      getShippingTimes: { url: '/api/basket_params/get_shipping_times', method: 'GET', isArray: true },
      getShippingConditions: { url: '/api/basket_params/shipping_conditions', method: 'GET', isArray: true },
      getCountAddress: { url: '/api/basket_params/count_address', method: 'GET', isArray: false }
    };
    return $resource(url, defaultParams, actions);
  }])//BasketParametersService

  .factory('BasketPService', ['ZonesService', 'NgTableParams', 'localStorageService', 'sweet', function(ZonesService, NgTableParams, localStorageService, sweet){
    //var authentication = Authentication;
    var servicio = {};
    servicio.cargarZonaLocalidad = function(id_location, id_zone){
      servicio.id_location = id_location;
      servicio.id_zone = id_zone;

      localStorageService.set('zonesLocationShipping', servicio.selected_zone_loc);
    };

    servicio._checkParameters = function(parametros){
      var error = false;
      var msg = '';
      if(parametros.id_zone === undefined || parametros.id_zone === null || parametros.id_location === undefined || parametros.id_location === null){
        error = true;
        msg = 'Debe seleccionar una zona.';
      }
      servicio.id_zone = parametros.id_zone;
      servicio.id_location = parametros.id_location;
     
      console.log('_checkParameters = error '+error+': '+msg+'; parametros.id_zone = ');console.log(parametros);
     
      return { error: error, msg: msg };
    };

    //Filtros de las zonas.
    servicio.zoneOptions = [];
    servicio.selected_zone_loc = [];
    
    servicio.getZoneFilter = function () {
      var zonesLocationShipping = localStorageService.get('zonesLocationShipping');

      ZonesService.getZones().then(function(data) {
        servicio.zoneOptions = data;

        if (zonesLocationShipping !== null) {
          servicio.selected_zone_loc = zonesLocationShipping;
          servicio.cargarZonaLocalidad(zonesLocationShipping.id_location, zonesLocationShipping.id_zone);
          localStorageService.set('zonesLocationShipping', servicio.selected_zone_loc);

        } else{
          servicio.selected_zone_loc = servicio.zoneOptions[0];
          servicio.cargarZonaLocalidad(servicio.zoneOptions[0].id_location, servicio.zoneOptions[0].id_zone);
          localStorageService.set('zonesLocationShipping', servicio.selected_zone_loc);
        }
      });
    };
    
    return servicio;
  }]);//BasketService
})();
