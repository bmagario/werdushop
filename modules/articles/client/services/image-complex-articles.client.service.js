//Articles service used to communicate Articles REST endpoints
(function () {
  'use strict';

  angular
    .module('articles')
    .factory('ImageComplexArticlesService', ImageComplexArticlesService);

  ImageComplexArticlesService.$inject = ['$resource'];

  function ImageComplexArticlesService($resource) {
    return $resource('api/complex_articles_image/:complexArticleId', {
      complexArticleId: '@id_complex_article'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
})();
