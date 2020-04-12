//Articles service used to communicate Articles REST endpoints
(function () {
  'use strict';

  angular
    .module('articles')
    .factory('ComplexArticlesService', ComplexArticlesService);

  ComplexArticlesService.$inject = ['$resource'];

  function ComplexArticlesService($resource) {
    var url, defaultParams, actions;

    url = '/api/articles_complex/:complexArticleId/';
    defaultParams = { complexArticleId: '@id_complex_article' };
    actions = {
      update: { method: 'PUT' },
      getArticles: { url: '/api/articles/get_articles/', method: 'GET', isArray: true },
      addArticle: { url: '/api/articles_complex_actions/add_article/', method: 'POST', isArray: true },
      removeArticle: { url: '/api/articles_complex_actions/remove_article/', method: 'POST', isArray: true }
    };

    return $resource(url, defaultParams, actions);
  }
})();
