(function () {
  'use strict';

  // Setting up route
  angular
  .module('users')
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

    // Users state routing
    $stateProvider
    .state('settings', {
      abstract: true,
      url: '/settings',
      templateUrl: 'modules/users/client/views/settings/settings.client.view.html',
      data: {
        roles: ['user', 'admin', 'canastero', 'gestor', 'empresa']
      }
    })
    .state('settings.profile', {
      url: '/profile',
      templateUrl: 'modules/users/client/views/settings/edit-profile.client.view.html'
    })
    .state('settings.password', {
      url: '/password',
      templateUrl: 'modules/users/client/views/settings/change-password.client.view.html'
    })
    .state('settings.address', {
      url: '/address',
      templateUrl: 'modules/users/client/views/settings/change-address.client.view.html'
    })
    .state('password', {
      abstract: true,
      url: '/password',
      template: '<ui-view/>'
    })
    .state('password.forgot', {
      url: '/forgot',
      templateUrl: 'modules/users/client/views/password/forgot-password.client.view.html'
    })
    .state('password.reset', {
      abstract: true,
      url: '/reset',
      template: '<ui-view/>'
    })
    .state('password.reset.invalid', {
      url: '/invalid',
      templateUrl: 'modules/users/client/views/password/reset-password-invalid.client.view.html'
    })
    .state('password.reset.success', {
      url: '/success',
      templateUrl: 'modules/users/client/views/password/reset-password-success.client.view.html'
    })
    .state('password.reset.form', {
      url: '/:token',
      templateUrl: 'modules/users/client/views/password/reset-password.client.view.html'
    });
  }
}());