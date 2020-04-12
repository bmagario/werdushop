//Articles service used to communicate Articles REST endpoints
(function () {
  'use strict';

  angular
    .module('articles')
    .factory('ArticlesDeliveriesService', ArticlesDeliveriesService);

  ArticlesDeliveriesService.$inject = ['$resource'];

  function ArticlesDeliveriesService($resource) {
    var url, defaultParams, actions;
 
    url = '/api/deliveries/:deliveryOrderId/';
    defaultParams = { deliveryOrderId: '@id_basket_order' };
    actions = {
      loadDelivery: { url: '/api/deliveries/:deliveryOrderId/load_delivery/', method: 'POST', isArray: true },
      changeArticle: { url: '/api/deliveries/:deliveryOrderId/change_article/', method: 'POST', isArray: true },
      addGift: { url: '/api/deliveries/:deliveryOrderId/add_gift/', method: 'POST', isArray: true },
      updateArticle: { url: '/api/deliveries/:deliveryOrderId/update_article/', method: 'POST', isArray: true },
      removeArticle: { url: '/api/deliveries/:deliveryOrderId/remove_article/', method: 'POST', isArray: true },
      closeDeliveryOrder: { url: '/api/deliveries/:deliveryOrderId/close_delivery_order/', method: 'POST', isArray: true },
      getArticles: { url: '/api/articles/get_articles/', method: 'GET', isArray: true }
    };
 
    return $resource(url, defaultParams, actions);
  }
})();