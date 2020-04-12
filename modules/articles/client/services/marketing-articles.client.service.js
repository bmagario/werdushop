//Articles service used to communicate Articles REST endpoints
(function () {
  'use strict';

  angular
    .module('articles')
    .factory('ArticlesMarketingService', ArticlesMarketingService);

  ArticlesMarketingService.$inject = ['$resource'];

  function ArticlesMarketingService($resource) {
    var url, defaultParams, actions;
 
    url = '/api/articles_marketing/';
    defaultParams = { };
    actions = {
      loadMarketing: { url: '/api/articles_marketing/load_marketing/', method: 'POST', isArray: true }
    };
 
    return $resource(url, defaultParams, actions);
  }
})();