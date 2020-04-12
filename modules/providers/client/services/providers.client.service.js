//Provider service used to communicate Provider REST endpoints
(function () {
  'use strict';

  angular
    .module('providers')
    .factory('ProvidersService', ProvidersService);

  ProvidersService.$inject = ['$resource'];

  function ProvidersService($resource) {
    var url, defaultParams, actions;

    url = '/api/providers/:id_provider/';
    defaultParams = { id_provider: '@id_provider' };
    actions = {
      update: { method: 'PUT' },
    };

    return $resource(url, defaultParams, actions);
  }
})();
