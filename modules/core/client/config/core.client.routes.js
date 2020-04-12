(function () {
  'use strict';

// Setting up route
  angular
  .module('core')
  .config(routeConfig);

  routeConfig.$inject = ['$stateProvider', '$urlRouterProvider'];

  function routeConfig($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.rule(function ($injector, $location) {
      var path = $location.path();
      var hasTrailingSlash = path.length > 1 && path[path.length - 1] === '/';

      if (hasTrailingSlash) {
        // if last character is a slash, return the same url without the slash
        var newPath = path.substr(0, path.length - 1);
        $location.replace().path(newPath);
      }
    });
    // Redirect to 404 when route not found
    $urlRouterProvider.otherwise(function ($injector, $location) {
      $injector.get('$state').transitionTo('not-found', null, {
        location: false
      });
    });

    // Home state routing

    $stateProvider
    .state('home', {
      url: '/',
      //templateUrl: 'modules/core/client/views/home.client.view.html',
      //controller: 'HomeController',
      //controllerAs: 'vm',
      template: '<ui-view/>',
      views: {
        'content@': {
          templateUrl : '/modules/core/client/views/home.client.view.html',
          controller  : 'HomeController'
        }/*,
        'sidebar@': {
          templateUrl : '/modules/core/client/views/sidebar.client.view.html'
        },
       'header@': {
          templateUrl : '/modules/core/client/views/header.client.view.html',
          controller  : 'HeaderController'
        },


        'footer@': {
          templateUrl : '/modules/core/client/views/footer.client.view.html',
          controller  : 'FooterController'
        }*/
      }
    })

    .state('home.terminos_y_condiciones', {
      url:'terminos_y_condiciones',
      views: {
        'content@': {
          templateUrl : '/modules/core/client/views/info/terminos_y_condiciones.client.view.html'
        }
      }
    })
    .state('home.politica_de_privacidad', {
      url:'politica_de_privacidad',
      views: {
        'content@': {
          templateUrl : '/modules/core/client/views/info/politica_de_privacidad.client.view.html'
        }
      }
    })
    .state('home.zonashorarios', {
      url:'zonas_y_horarios',
      views: {
        'content@': {
          templateUrl : '/modules/core/client/views/info/zonas_y_horarios.client.view.html'
        }
      }
    })
    //navbar
    .state('home.frutas', {
      url: 'frutas',
      views: {
        'content@': {
          templateUrl: '/modules/articles/client/views/gondola-articles.client.view.html',
        }
      },
      data: {
        filtro: 'Frutas'
      }
    })
    .state('home.combos', {
      url: 'combos',
      views: {
        'content@': {
          templateUrl: 'modules/core/client/views/navbar/combos.client.view.html'
        }
      },
      data: {
        filtro: 'Combos'
      }
    })
    .state('home.ensaladas', {
      url: 'ensaladas',
      views: {
        'content@': {
          templateUrl: 'modules/core/client/views/navbar/ensaladas.client.view.html'
        }
      },
      data: {
        filtro: 'Ensaladas'
      }
    })
    .state('home.recetas', {
      url: 'recetas',
      views: {
        'content@': {
          templateUrl: 'modules/core/client/views/navbar/recetas.client.view.html'
        }
      },
      data: {
        filtro: 'Recetas'
      }
    })
    .state('home.verduras', {
      url: 'verduras',
      views: {
        'content@': {
          templateUrl: '/modules/articles/client/views/gondola-articles.client.view.html'
        }
      },
      data: {
        filtro: 'Hortalizas'
      }
    })
    .state('home.wsearch', {
      url: 'wsearch?name',
      views: {
        'content@': {
          templateUrl: '/modules/articles/client/views/gondola-articles.client.view.html'
        }
      },
      data: {
        filtro: ''
      }
    })

    //errores - advertencias
    .state('not-found', {
      url: '/not-found',
      templateUrl: 'modules/core/client/views/404.client.view.html',
      data: {
        ignoreState: true
      }
    })
    .state('bad-request', {
      url: '/bad-request',
      templateUrl: 'modules/core/client/views/400.client.view.html',
      data: {
        ignoreState: true
      }
    })
    .state('forbidden', {
      url: '/forbidden',
      templateUrl: 'modules/core/client/views/403.client.view.html',
      data: {
        ignoreState: true
      }
    });
  }
}());
