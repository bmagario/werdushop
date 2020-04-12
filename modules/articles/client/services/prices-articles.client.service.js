//Articles service used to communicate Articles REST endpoints
(function () {
  'use strict';

  angular
    .module('articles')
    .factory('ArticlesPricesService', ArticlesPricesService);

  ArticlesPricesService.$inject = ['$resource'];

  function ArticlesPricesService($resource) {
    var url, defaultParams, actions;
 
    url = '/api/articles_prices/';
    defaultParams = {};
    actions = {
      update: { method: 'PUT' },
      loadPrice: { url: '/api/articles_prices/load_price/', method: 'POST', isArray: true },
      enableArticle: { url: '/api/articles_prices/enable_article/', method: 'POST', isArray: true }
    };
 
    return $resource(url, defaultParams, actions);
  }
})();
