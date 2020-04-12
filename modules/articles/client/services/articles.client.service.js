//Articles service used to communicate Articles REST endpoints
(function () {
  'use strict';

  angular
    .module('articles')
    .factory('ArticlesService', ArticlesService);

  ArticlesService.$inject = ['$resource'];

  function ArticlesService($resource) {
    var url, defaultParams, actions;
 
    url = '/api/articles/:articleId/';
    defaultParams = { articleId: '@id_article' };
    actions = {
      update: { method: 'PUT' }
    };
 
    return $resource(url, defaultParams, actions);
  }
})();