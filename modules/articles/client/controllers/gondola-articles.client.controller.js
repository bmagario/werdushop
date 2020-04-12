'use strict';
angular.module('articles')
.controller('GondolaArticlesController', ['$state', '$scope', '$rootScope', 'ArticlesDeliveriesService', 'localStorageService', 'GondolaArticlesService','Authentication', 'BasketService', '$q', '$timeout', 'modalService', 'globals',
function GondolaArticlesController($state, $scope, $rootScope, ArticlesDeliveriesService, localStorageService, GondolaArticlesService, Authentication, BasketService, $q, $timeout, modalService, globals) {
  var authentication = Authentication;
  $scope.basketS = BasketService;
  $scope.gondola = [];

  //Recuperar la lista de articulos para mostrar en la góndola
  $scope.listar = function() {
    if($state !== undefined && $state.current !== undefined && $state.current.data !== undefined){
      var group = $state.current.data.filtro;
      var ajax_params = {};
      return getArticlesGondola(group, $state.params);
    }
    return [];
  };
  $scope.listar();


  function getArticlesGondola (group, ajax_params) {
    $scope.gondola = [];
    var deferred = $q.defer();
    //recupero la gondola desde la base de datos
    GondolaArticlesService
    .getGondola(ajax_params)
    .$promise
    .then(function (result) {
      if(result !== null && result !== undefined) {
        
        var articulos = result[0].articles;
        var detalles_articulos_complejos = result[0].complex_article_detail;
        
        var cant = 0;

        for(var i = 0; i < articulos.length; i++) {

          if($state.current.name === 'home.wsearch' || articulos[i].group_name === group) {
            //si tiene precio cargado lo muestro en la góndola
            if(authentication.user) {
              cant = BasketService.cantidadArticuloCanasta(articulos[i]);
            } else {
        
              cant = 0;
            }
            
            var dc = null;
            if(articulos[i].tipo === globals.ARTICULO_COMPLEJO){
              dc = detalles_articulos_complejos[articulos[i].id_complex_article];
            }

            $scope.gondola.push({
              a: articulos[i],
              dc: dc,
              ver_cantidad: (cant > 0),
              ver_canasta: (cant <= 0),
              ver_mas: (cant > 0),
              ver_menos: (cant > 0)
            });
            
          }
        } //for
      }//ifresult
      deferred.resolve($scope.gondola);
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

  $scope.agregaraCanasta = function(articulo) {
    if(authentication.user) {
      BasketService.agregar(articulo.a, 1);
      actualizarBotones(articulo);
    } else {
      verIngreso();
    }
  };

  $scope.quitardeCanasta = function(articulo) {
    if(authentication.user) {
      BasketService.quitar(articulo.a, 1);
      actualizarBotones(articulo);
    } else {
      verIngreso();
    }
  };


  function actualizarBotones(articulo) {

    if(authentication.user &&  articulo !== null && articulo !== undefined) {
      if(articulo.a !== undefined && articulo.a !== null) {

        //Obtiene la cantidad en canasta de este articulo
        var cantidad = BasketService.cantidadArticuloCanasta(articulo.a);

        //Actualiza los botones y visualización de cada articulo en la gondola
        articulo.ver_cantidad = (cantidad > 0);
        articulo.ver_canasta = !articulo.ver_cantidad;
        articulo.ver_mas = articulo.ver_cantidad;
        articulo.ver_menos = articulo.ver_cantidad;
      }
    } else {
      for (var i = 0; i < $scope.basketS.basket.articulos.length; i++) {
        actualizarBotones($scope.basketS.basket.articulos[i]);
      }
    }
  }

  $scope.botones = function(articulo) {
    actualizarBotones(articulo);
  };

  $scope.calcularAbrUnidadMedida = function(unidades, articulo) {
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

 /*//Agregar el articulo a la canasta de compras
  $scope.agregar = function(articulo) {
    $scope.gondolaS.agregaraCanasta(articulo);
  };

  //Quita una unidad del articulo de la canasta de compras
  $scope.quitar = function(articulo) {
    $scope.gondolaS.quitardeCanasta(articulo);
  };*/

 //Mostrar los datos de un articulo en un panel o modal
  $scope.mostrarArticuloGondola = function(articulo){
    $rootScope.article = articulo;

    var modalOptions = {
      closeButtonText: ' ',
      actionButtonText: ' ',
      headerText: $rootScope.article.name,
      bodyText: ' ',
      controller: 'GondolaArticlesController',
      bodyUrl: 'modules/articles/client/views/gondola/gondola-article.client.view.html'
    };

    var modalDefaults = {
      backdrop: true,
      keyboard: true,
      modalFade: true,
      templateUrl: '/modules/core/client/views/modal.client.view.html',
      size: '2em'
    };

    modalService.showModal(modalDefaults, modalOptions);
  };

   //Mostrar los datos de un articulo complejo en un panel o modal
  $scope.mostrarArticuloComplejoGondola = function(articulo){
    $rootScope.complex_article = articulo;

    var modalOptions = {
      closeButtonText: ' ',
      actionButtonText: ' ',
      headerText: $rootScope.complex_article.a.name,
      bodyText: ' ',
      controller: 'GondolaArticlesController',
      bodyUrl: 'modules/articles/client/views/gondola/gondola-article-complex.client.view.html'
    };

    var modalDefaults = {
      backdrop: true,
      keyboard: true,
      modalFade: true,
      templateUrl: '/modules/core/client/views/modal.client.view.html',
      size: '1em'
    };

    modalService.showModal(modalDefaults, modalOptions);
  };

  $scope.filterFunction = function(element) {
    return element.name.match(/^Ma/) ? true : false;
  };

  // Busqueda Global de Articulos.
  $scope.getArticles = function(name) {
    $scope.noResults = false;
    var ajax_params = {
      name: name
    };

    return GondolaArticlesService
    .getGondola(ajax_params)
    .$promise.then(function (result) {

      var articulos = result[0].articles;
      if(articulos.length === 0){
        $scope.noResults = true;
      }
      return articulos;
    }, function(error) {
      console.log(error);
    });
  };

  $scope.findArticles = function($item, $model, $label) {

    var name = '';
    if(angular.isObject($scope.globalArticle)){
      name = $scope.globalArticle.name;
    } else if(angular.isString($scope.globalArticle)){
      name = $scope.globalArticle;
    }
    if(name !== undefined && name !== null && name !== ''){
      $state.go('home.wsearch', { name: name });
      $scope.listar();
    }
    $scope.globalArticle = '';
  };

}]);
