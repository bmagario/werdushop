//Articles service used to communicate Articles REST endpoints
(function () {
  'use strict';

  angular
    .module('articles')
    .factory('ComplexArticlesPricesService', ComplexArticlesPricesService);

  ComplexArticlesPricesService.$inject = ['$resource'];

  function ComplexArticlesPricesService($resource) {
    var url, defaultParams, actions;
 
    url = '/api/complex_articles_prices/';
    defaultParams = {};
    actions = {
      update: { method: 'PUT' },
      loadPrice: { url: '/api/complex_articles_prices/load_price/', method: 'POST', isArray: true },
      enableArticle: { url: '/api/complex_articles_prices/enable_article/', method: 'POST', isArray: true }
    };
 
    return $resource(url, defaultParams, actions);
  }
})();