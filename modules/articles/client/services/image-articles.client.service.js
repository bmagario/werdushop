//Articles service used to communicate Articles REST endpoints
(function () {
  'use strict';

  angular
    .module('articles')
    .factory('ImageArticlesService', ImageArticlesService);

  ImageArticlesService.$inject = ['$resource'];

  function ImageArticlesService($resource) {
    return $resource('api/articles_image/:articleId', {
      articleId: '@id_article'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
})();
