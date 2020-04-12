//Articles service used to communicate Articles REST endpoints
(function () {
  'use strict';

  angular
    .module('articles')
    .factory('ArticlesStocksService', ArticlesStocksService);

  ArticlesStocksService.$inject = ['$resource'];

  function ArticlesStocksService($resource) {
    var url, defaultParams, actions;
 
    url = '/api/articles_stocks/';
    defaultParams = { };
    actions = {
      loadStock: { url: '/api/articles_stocks/load_stock/', method: 'POST', isArray: true }
    };
 
    return $resource(url, defaultParams, actions);
  }
})();