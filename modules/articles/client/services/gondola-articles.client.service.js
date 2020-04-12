//Articles service used to communicate Articles REST endpoints
(function () {
  'use strict';
  angular.module('articles')

  .factory('GondolaArticlesService', ['$resource', function ($resource) {
    var url, defaultParams, actions;
    url = '';
    defaultParams = { articleGondolaId: '@_id' };
    actions = {
      update: { method: 'PUT' },
      getGondola: { url: '/api/articles_gondola/', method: 'GET', isArray: true }
    };

    return $resource(url, defaultParams, actions);
  }])
  .factory('GondolaService', ['Authentication', function(Authentication){
    var authentication = Authentication;
    var servicio = {};
   

    function actualizarBotones(articulo, cantidad) {
      if(authentication.user &&  articulo !== null && articulo !== undefined) {
        if(articulo.a !== undefined && articulo.a !== null) {
          
          //Actualiza los botones y visualización de cada articulo en la gondola
          articulo.ver_cantidad = (cantidad > 0);
          articulo.ver_canasta = !articulo.ver_cantidad;
          articulo.ver_mas = articulo.ver_cantidad;
          articulo.ver_menos = articulo.ver_cantidad;
        }
      } 
    }

    servicio.botones = function(articulo) {
      actualizarBotones(articulo);
    };


    return servicio;
  }]);
/*
  .factory('GondolaService', ['GondolaArticlesService', 'BasketService', '$rootScope', 'Authentication', '$q', '$timeout', 'modalService', 'globals', 
    function(GondolaArticlesService, BasketService, $rootScope, Authentication, $q, $timeout, modalService, globals){
    var authentication = Authentication;
    var basketS = BasketService;
    var servicio = {};
    servicio.gondola = [];

    function getArticlesGondola (group) {
      servicio.gondola = [];
      var deferred = $q.defer();
      //recupero la gondola desde la base de datos
      GondolaArticlesService
      .getGondola()
      .$promise
      .then(function (result) {
        console.log(result);
        if(result !== null && result !== undefined) {
          var articulos = [];
          var cant = 0;
          articulos = result;
          for(var i = 0; i < articulos.length; i++) {
            if(articulos[i].group_name === group) {
              //si tiene precio cargado lo muestro en la góndola
              if(authentication.user) {
                cant = BasketService.cantidadArticuloCanasta(articulos[i]);                
              } else {
                cant = 0;
              }
              servicio.gondola.push({ 
                a: articulos[i], 
                ver_cantidad: (cant > 0),
                ver_canasta: (cant <= 0),
                ver_mas: (cant > 0),
                ver_menos: (cant > 0)
              });
console.log('servicio.gondola get articulos de la gondola ');              console.log(servicio.gondola);
            }
          } //for
        }//ifresult
        deferred.resolve(servicio.gondola);
        return;
      }, function (result) {
        deferred.reject(result);
        return;
      });
      return deferred.promise;
    }

    function verIngreso() {
      if(!authentication.user) {
        var modalOptions = {
          closeButtonText: 'Cerrar',
          actionButtonText: 'Aceptar',
          headerText: 'Visitá la werdulería!',
          bodyText: ' ',
          bodyUrl: 'modules/users/client/views/authentication/signin.client.view.html'
        };
        var modalDefaults = {
          backdrop: true,
          keyboard: true,
          modalFade: true,
          templateUrl: '/modules/core/client/views/modal.client.view.html',
          size: 'sm'
        };
        modalService.showModal(modalDefaults, modalOptions);
      }
    }   

    servicio.agregaraCanasta = function(articulo) {
      if(authentication.user) {            
        console.log('CBCA001>Controller Articles Basket agregar articulo: '); 
        BasketService.agregar(articulo.a, 1);
        actualizarBotones(articulo);
      } else {
        verIngreso();
      }
    };

    servicio.quitardeCanasta = function(articulo) {
      if(authentication.user) {
        console.log('CBCA003>Controller Articles Basket quitar articulo: '); 
        BasketService.quitar(articulo.a, 1);
        actualizarBotones(articulo);
      } else {
        verIngreso();
      }    
    };

    servicio.listarGondola = function($state){
      if($state !== undefined && $state.current !== undefined && $state.current.data !== undefined){
        var grupo_articulos = $state.current.data.filtro;
        return getArticlesGondola(grupo_articulos);
      }
      return [];
    };  

    servicio.verDetalles = function(articulo) {
      $rootScope.article = articulo;

      var modalOptions = {
        closeButtonText: ' ',
        actionButtonText: ' ',
        headerText: articulo.name,
        bodyText: ' ',
        bodyUrl: 'modules/articles/client/views/gondola-article.client.view.html'
      };

      var modalDefaults = {
        backdrop: true,
        keyboard: true,
        modalFade: true,
        templateUrl: '/modules/core/client/views/modal.client.view.html',
        size: 'sm'
      };

      modalService.showModal(modalDefaults, modalOptions);            
    };

    function actualizarBotones(articulo) {
      
      console.log('articulo, actualizarBotones ');              console.log(articulo);

      if(authentication.user &&  articulo !== null && articulo !== undefined) {
        if(articulo.a !== undefined && articulo.a !== null) {
          
          //Obtiene la cantidad en canasta de este articulo
          var cantidad = BasketService.cantidadArticuloCanasta(articulo.a);
          
          console.log('CBCA002>Controller Articles Basket actualizar botones gondola. Cantidad: '+cantidad);          
          //Actualiza los botones y visualización de cada articulo en la gondola
          articulo.ver_cantidad = (cantidad > 0);
          articulo.ver_canasta = !articulo.ver_cantidad;
          articulo.ver_mas = articulo.ver_cantidad;
          articulo.ver_menos = articulo.ver_cantidad;
        }
      } else {
        console.log('actualizarBotones cuando el parametro es nulo en gondola.articles.client.service, RECORRO TODOS LOS ART DE LA CANASTA Y ACTUALIZO LOS BOTONES DE LA GONDOLA');
        for (var i = 0; i < basketS.basket.articulos.length; i++) {
          actualizarBotones(basketS.basket.articulos[i]);
        }
      }
    }

    servicio.botones = function(articulo) {
      actualizarBotones(articulo);
    };

    servicio.calcularAbrUnidadMedida = function(unidades, articulo) {
      if(unidades !== null && unidades !== undefined && articulo !== null && articulo !== undefined) {
        var total = 0;
        var cantidad = unidades.split("/");

        if (cantidad.length > 1 && cantidad[1] > 0) {
          total = cantidad[0]/cantidad[1];
        }
        if (total <= 1) {
          return articulo.measurement_unit_abbreviation;
        } else {
          return articulo.measurement_unit_abbreviation_plural;
        }
      }
    };

    return servicio;
  }]);*/
})();