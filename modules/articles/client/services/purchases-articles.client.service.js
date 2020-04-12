//Articles service used to communicate Articles REST endpoints
(function () {
  'use strict';

  angular
    .module('articles')
    .factory('ArticlesPurchasesService', ArticlesPurchasesService);

  ArticlesPurchasesService.$inject = ['$resource'];

  function ArticlesPurchasesService($resource) {
    var url, defaultParams, actions;

    url = '/api/articles_purchases/:purchaseOrderId/';
    defaultParams = { purchaseOrderId: '@id_purchase_order' };
    actions = {
      update: { method: 'PUT' },
      enableArticle: { url: '/api/articles_prices/enable_article/', method: 'POST', isArray: true },
      loadPurchase: { url: '/api/articles_purchases/:purchaseOrderId/load_purchase/', method: 'POST', isArray: true },
      addArticle: { url: '/api/articles_purchases/:purchaseOrderId/add_article/', method: 'POST', isArray: true },
      checkConsistency: { url: '/api/articles_purchases/:purchaseOrderId/check_consistency/', method: 'POST', isArray: true },
      loadProvider: { url: '/api/articles_purchases/:purchaseOrderId/load_provider/', method: 'POST', isArray: true },
      closePurchaseOrder: { url: '/api/articles_purchases/:purchaseOrderId/close_purchase_order/', method: 'POST', isArray: true },
      addPurchaseOrder: { url: '/api/articles_purchases/add_purchase_order/', method: 'POST', isArray: true },
      getArticlesPurchaseOrder: { url: '/api/articles_purchases/get_articles/', method: 'GET' },
      getPaymentsPurchaseOrder: { url: '/api/articles_purchases/get_payments/', method: 'GET' },
      addPaymentMethod: { url: '/api/articles_purchases/:purchaseOrderId/add_payment_method/', method: 'POST', isArray: true },
      updatePaymentMethod: { url: '/api/articles_purchases/:purchaseOrderId/update_payment_method/', method: 'POST', isArray: true },
      removePaymentMethod: { url: '/api/articles_purchases/:purchaseOrderId/remove_payment_method/', method: 'POST', isArray: true },
      getArticles: { url: '/api/articles/get_articles/', method: 'GET', isArray: true }
    };

    return $resource(url, defaultParams, actions);
  }
})();
