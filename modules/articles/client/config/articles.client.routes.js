(function () {
  'use strict';

  angular
    .module('articles')
    .config(routeConfig);

  routeConfig.$inject = ['$stateProvider'];

  function routeConfig($stateProvider) {
    $stateProvider
    .state('articles', {
      abstract: true,
      url: '/articles',
      template: '<ui-view/>'
    })
    .state('articles.list', {
      url: '',
      templateUrl: 'modules/articles/client/views/list-articles.client.view.html',
      controller: 'ArticlesListController',
      controllerAs: 'vm',
      data: {
        roles: ['admin'],
        pageTitle: 'Listado de Artículos'
      }
    })
    .state('articles.view', {
      url: '/:articleId',
      templateUrl: 'modules/articles/client/views/view-article.client.view.html',
      controller: 'ArticlesController',
      controllerAs: 'vm',
      resolve: {
        articleResolve: getArticle
      },
      data:{
        roles: ['admin'],
        pageTitle: 'Artículo {{ articleResolve.name }}'
      }
    })
    .state('articles.create', {
      url: '/create',
      templateUrl: 'modules/articles/client/views/form-article.client.view.html',
      controller: 'ArticlesController',
      controllerAs: 'vm',
      resolve: {
        articleResolve: newArticle
      },
      data: {
        roles: ['admin'],
        pageTitle : 'Alta de Artículos'
      }
    })
    .state('articles.edit', {
      url: '/:articleId/edit',
      templateUrl: 'modules/articles/client/views/form-article.client.view.html',
      controller: 'ArticlesController',
      controllerAs: 'vm',
      resolve: {
        articleResolve: getArticle
      },
      data: {
        roles: ['admin'],
        pageTitle: 'Editar Artículo {{ articleResolve.name }}'
      }
    })
    .state('articles.image', {
      url: '/:articleId/image',
      templateUrl: 'modules/articles/client/views/image-article.client.view.html',
      controller: 'ImageArticlesController',
      controllerAs: 'vm',
      resolve: {
        articleResolve: getArticleImage
      },
      data: {
        roles: ['admin'],
        pageTitle: 'Cargar Imagen {{ articleResolve.name }}'
      }
    })
    .state('articles_purchases', {//Tener en cuenta que tiene que estar esto del abastract lpm.
      abstract: true,
      url: '/articles_purchases',
      template: '<ui-view/>'
    })
    .state('articles_purchases.list', {
      url: '',
      templateUrl: 'modules/articles/client/views/list-purchases-articles.client.view.html',
      controller: 'PurchasesArticlesListController',
      controllerAs: 'vm',
      data: {
        roles: ['admin'],
        pageTitle : 'Órdenes de Compra'
      }
    })
    .state('articles_purchases.load', {
      url: '/:purchaseOrderId/load',
      templateUrl: 'modules/articles/client/views/purchase-articles.client.view.html',
      controller: 'PurchaseOrderController',
      controllerAs: 'vm',
      resolve: {
        purchaseOrderResolve: getPurchaseOrder
      },
      data: {
        roles: ['admin'],
        pageTitle: 'Orden de Compra N° {{ purchaseOrderResolve.id_purchase_order }}'
      }
    })
    .state('articles_surveys', {
      url: '/articles_surveys',
      templateUrl: 'modules/articles/client/views/surveys-articles.client.view.html',
      controller: 'ArticlesSurveysController',
      controllerAs: 'vm',
      data: {
        roles: ['admin'],
        pageTitle : 'Relevamiento Precios'
      }
    })
    .state('articles_stocks', {
      url: '/articles_stocks',
      templateUrl: 'modules/articles/client/views/stocks-articles.client.view.html',
      controller: 'ArticlesStocksController',
      controllerAs: 'vm',
      data: {
        roles: ['admin'],
        pageTitle : 'Stock'
      }
    })
    .state('articles_marketing', {
      url: '/articles_marketing',
      templateUrl: 'modules/articles/client/views/marketing-articles.client.view.html',
      controller: 'ArticlesMarketingController',
      controllerAs: 'vm',
      data: {
        roles: ['admin'],
        pageTitle : 'Carga Markting'
      }
    })
    .state('articles_consumption', {
      url: '/articles_consumption',
      templateUrl: 'modules/articles/client/views/consumption-articles.client.view.html',
      controller: 'ArticlesConsumptionController',
      controllerAs: 'vm',
      data: {
        roles: ['admin'],
        pageTitle : 'Carga Consumo'
      }
    })
    .state('deliveries', {//Tener en cuenta que tiene que estar esto del abastract lpm.
      abstract: true,
      url: '/deliveries',
      template: '<ui-view/>'
    })
    .state('deliveries.list', {
      url: '',
      templateUrl: 'modules/articles/client/views/list-deliveries-articles.client.view.html',
      controller: 'DeliveriesArticlesListController',
      controllerAs: 'vm',
      data: {
        roles: ['admin'],
        pageTitle : 'Ordenes de Entrega'
      }
    })
    .state('deliveries.close', {
      url: '/:deliveryOrderId/close',
      templateUrl: 'modules/articles/client/views/delivery-articles.client.view.html',
      controller: 'ArticlesDeliveriesController',
      controllerAs: 'vm',
      resolve: {
        deliveryOrderResolve: getDeliveryOrder
      },
      data: {
        roles: ['admin'],
        pageTitle: 'Orden de Entrega N° {{ deliveryOrderResolve.id_basket_order }}'
      }
    })
    .state('articles_prices', {
      url: '/articles_prices',
      templateUrl: 'modules/articles/client/views/prices-articles.client.view.html',
      controller: 'ArticlesPricesController',
      controllerAs: 'vm',
      data: {
        roles: ['admin'],
        pageTitle : 'Precios Artículos'
      }
    })
    .state('complex_articles', {//Tner en cuenta que tiene que estar esto del abastract lpm.
      abstract: true,
      url: '/complex_articles',
      template: '<ui-view/>'
    })
    .state('complex_articles.list', {
      url: '',
      templateUrl: 'modules/articles/client/views/list-complex-articles.client.view.html',
      controller: 'ComplexArticlesListController',
      controllerAs: 'vm',
      data: {
        roles: ['admin'],
        pageTitle : 'Listado de Artículos Complejos'
      }
    })
    .state('complex_articles.create', {
      url: '/create',
      templateUrl: 'modules/articles/client/views/form-complex-article.client.view.html',
      controller: 'ComplexArticlesController',
      controllerAs: 'vm',
      resolve: {
        complexArticleResolve: newComplexArticle
      },
      data: {
        roles: ['admin'],
        pageTitle : 'Alta de Artículos Complejos'
      }
    })
    .state('complex_articles.edit', {
      url: '/:complexArticleId/edit',
      templateUrl: 'modules/articles/client/views/form-complex-article.client.view.html',
      controller: 'ComplexArticlesController',
      controllerAs: 'vm',
      resolve: {
        complexArticleResolve: getComplexArticle
      },
      data: {
        roles: ['admin'],
        pageTitle: 'Editar Artículo Complejo {{ complexArticleResolve.name }}'
      }
    })
    .state('complex_articles.image', {
      url: '/:complexArticleId/image',
      templateUrl: 'modules/articles/client/views/image-complex-article.client.view.html',
      controller: 'ImageComplexArticlesController',
      controllerAs: 'vm',
      resolve: {
        articleResolve: getComplexArticleImage
      },
      data: {
        roles: ['admin'],
        pageTitle: 'Cargar Imagen {{ articleResolve.name }}'
      }
    })
    .state('complex_articles.prices', {
      url: '/complex_articles_prices',
      templateUrl: 'modules/articles/client/views/prices-complex-articles.client.view.html',
      controller: 'ComplexArticlesPricesController',
      controllerAs: 'vm',
      data: {
        roles: ['admin'],
        pageTitle : 'Precios Artículos Complejos'
      }
    })
    .state('articles.gondola.list', {
      url: '/gondola',
      templateUrl: 'modules/articles/client/views/gondola-articles.client.view.html',
      controller: 'GondolaArticlesController',
      controllerAs: 'vm',
      data: {
        //roles: ['*'],
        pageTitle: 'Gondola de Artículos'
      }
    })
    
    .state('articles.gondola.view', {
      url: '/:articleId',
      templateUrl: 'modules/articles/client/views/gondola-article.client.view.html',
      controller: 'GondolaArticlesController',
      controllerAs: 'vm',
      resolve: {
        articleResolve: getArticleGondola
      },
      data:{
        //roles: ['*'],
        pageTitle: 'Artículo {{ articleResolve.name }}'
      }
    })
    .state('basket_params', {
      abstract: true,
      url: '/basket_params',
      templateUrl: 'modules/articles/client/views/basket/basket-parameters.client.view.html',
      controller: 'BasketParametersController',
      controllerAs: 'vm',
      data: {
        roles: ['admin']
      }
    })
    .state('basket_params.list', {
      url: '/list',
      templateUrl: 'modules/articles/client/views/basket/basket-parameters-list.client.view.html',
    })
    .state('basket_params.days', {
      url: '/days',
      templateUrl: 'modules/articles/client/views/basket/basket-parameters-day.client.view.html',
      controller: 'BasketParametersDateController',
      controllerAs: 'vm'
    })
    .state('basket_params.times', {
      url: '/times',
      templateUrl: 'modules/articles/client/views/basket/basket-parameters-time.client.view.html',
      controller: 'BasketParametersTimeController',
      controllerAs: 'vm'
    })
    .state('basket_params.shipping_cost', {
      url: '/shipping_cost',
      templateUrl: 'modules/articles/client/views/basket/basket-parameters-shipping_cost.client.view.html',
      controller: 'BasketParametersCostController',
      controllerAs: 'vm'
    })

    .state('basket', {
      template: '<ui-view/>'
    });
  }

  getArticleImage.$inject = ['$stateParams', 'ImageArticlesService'];

  function getArticleImage($stateParams, ImageArticlesService) {
    return ImageArticlesService.get({
      articleId: $stateParams.articleId
    }).$promise;
  }

  getArticle.$inject = ['$stateParams', 'ArticlesService'];

  function getArticle($stateParams, ArticlesService) {
    return ArticlesService.get({
      articleId: $stateParams.articleId
    }).$promise;
  }

  getArticleGondola.$inject = ['$stateParams', 'GondolaArticlesService'];

  function getArticleGondola($stateParams, GondolaArticlesService) {
    return GondolaArticlesService.get({
      articleId: $stateParams.articleId
    }).$promise;
  }

  newArticle.$inject = ['ArticlesService'];

  function newArticle(ArticlesService) {
    return new ArticlesService();
  }

  //Compex Articles.
  getComplexArticle.$inject = ['$stateParams', 'ComplexArticlesService'];

  function getComplexArticle($stateParams, ComplexArticlesService) {
    return ComplexArticlesService.get({
      complexArticleId: $stateParams.complexArticleId
    }).$promise;
  }

  newComplexArticle.$inject = ['ComplexArticlesService'];

  function newComplexArticle(ComplexArticlesService) {
    return new ComplexArticlesService();
  }

  getComplexArticleImage.$inject = ['$stateParams', 'ImageComplexArticlesService'];

  function getComplexArticleImage($stateParams, ImageComplexArticlesService) {
    return ImageComplexArticlesService.get({
      complexArticleId: $stateParams.complexArticleId
    }).$promise;
  }

  getDeliveryOrder.$inject = ['$stateParams', 'ArticlesDeliveriesService'];

  function getDeliveryOrder($stateParams, ArticlesDeliveriesService) {
    return ArticlesDeliveriesService.get({
      deliveryOrderId: $stateParams.deliveryOrderId
    }).$promise;
  }

  getPurchaseOrder.$inject = ['$stateParams', 'ArticlesPurchasesService'];

  function getPurchaseOrder($stateParams, ArticlesPurchasesService) {
    return ArticlesPurchasesService.get({
      purchaseOrderId: $stateParams.purchaseOrderId
    }).$promise;
  }

  getShippingTime.$inject = ['$stateParams', 'BasketPService'];

  function getShippingTime($stateParams, BasketPService) {
    return BasketPService.get({
      shippingTimesId: $stateParams.shippingTimesId
    }).$promise;
  }

})();