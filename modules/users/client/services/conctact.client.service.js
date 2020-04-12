(function () {
  'use strict';

  angular
    .module('users')
    .factory('ContactService', ContactService);

  ContactService.$inject = ['$resource'];

  function ContactService($resource) {
    var url, defaultParams, actions;

    defaultParams = { };
    actions = {
      sendContact: { url: '/api/users/contact/', method: 'POST', isArray: true },
    };

    return $resource(url, defaultParams, actions);
  }
})();
