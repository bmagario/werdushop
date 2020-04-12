//Articles service used to communicate Articles REST endpoints
(function () {
  'use strict';

  angular
    .module('articles')
    .factory('ArticlesConsumptionService', ArticlesConsumptionService);

  ArticlesConsumptionService.$inject = ['$resource'];

  function ArticlesConsumptionService($resource) {
    var url, defaultParams, actions;
 
    url = '/api/articles_consumption/';
    defaultParams = { };
    actions = {
      loadConsumption: { url: '/api/articles_consumption/load_consumption/', method: 'POST', isArray: true }
    };
 
    return $resource(url, defaultParams, actions);
  }
})();