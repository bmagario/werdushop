'use strict';

/**
 * Module dependencies
 */
var articlesPolicy = require('../policies/articles.server.policy'),
  articles = require('../controllers/articles.server.controller'),
  articles_purchases = require('../controllers/purchases-articles.server.controller'),
  articles_surveys = require('../controllers/surveys-articles.server.controller'),
  articles_prices = require('../controllers/prices-articles.server.controller'),
  articles_gondola = require('../controllers/gondola-articles.server.controller'),
  articles_basket = require('../controllers/basket-articles.server.controller'),
  articles_stocks = require('../controllers/stocks-articles.server.controller'),
  articles_complex = require('../controllers/complex-articles.server.controller'),
  parameters_basket = require('../controllers/basket-parameters/basket-parameters.server.controller'),
  parameters_date_basket = require('../controllers/basket-parameters/basket-parameters-date.server.controller'),
  parameters_cost_basket = require('../controllers/basket-parameters/basket-parameters-cost.server.controller'),
  parameters_time_basket = require('../controllers/basket-parameters/basket-parameters-time.server.controller'),
  deliveries = require('../controllers/deliveries-articles.server.controller');

module.exports = function(app) {
  // Articles Routes.
  app.route('/api/articles').all(articlesPolicy.isAllowed)
    .get(articles.list)
    .post(articles.create);

  app.route('/api/articles/get_articles').all(articlesPolicy.isAllowed)
    .get(articles.get_articles);

  app.route('/api/articles/:articleId').all(articlesPolicy.isAllowed)
    .get(articles.read)
    .put(articles.update);

  //Article Images Route.
  app.route('/api/articles_image/:articleId').all(articlesPolicy.isAllowed)
    .get(articles.read)
    .post(articles.image);

  // Articles Purchases Routes.
  app.route('/api/articles_purchases').all(articlesPolicy.isAllowed)
    .get(articles_purchases.list_purchases);

  app.route('/api/articles_purchases/add_purchase_order').all(articlesPolicy.isAllowed)
    .post(articles_purchases.add_purchase_order);

  app.route('/api/articles_purchases/get_articles').all(articlesPolicy.isAllowed)
    .get(articles_purchases.get_articles);

  app.route('/api/articles_purchases/get_payments').all(articlesPolicy.isAllowed)
      .get(articles_purchases.get_payments);

  app.route('/api/articles_purchases/:purchaseOrderId').all(articlesPolicy.isAllowed)
    .get(articles_purchases.read);

  app.route('/api/articles_purchases/:purchaseOrderId/load_purchase').all(articlesPolicy.isAllowed)
    .post(articles_purchases.load_purchase);

  app.route('/api/articles_purchases/:purchaseOrderId/add_article').all(articlesPolicy.isAllowed)
    .post(articles_purchases.add_article);

  app.route('/api/articles_purchases/:purchaseOrderId/add_payment_method').all(articlesPolicy.isAllowed)
    .post(articles_purchases.add_payment_method);

  app.route('/api/articles_purchases/:purchaseOrderId/update_payment_method').all(articlesPolicy.isAllowed)
    .post(articles_purchases.update_payment_method);

  app.route('/api/articles_purchases/:purchaseOrderId/remove_payment_method').all(articlesPolicy.isAllowed)
    .post(articles_purchases.remove_payment_method);

  app.route('/api/articles_purchases/:purchaseOrderId/check_consistency').all(articlesPolicy.isAllowed)
    .post(articles_purchases.check_consistency);

  app.route('/api/articles_purchases/:purchaseOrderId/load_provider').all(articlesPolicy.isAllowed)
      .post(articles_purchases.load_provider);

  app.route('/api/articles_purchases/:purchaseOrderId/close_purchase_order').all(articlesPolicy.isAllowed)
    .post(articles_purchases.close_purchase_order);

  // Articles Surveys Routes.
  app.route('/api/articles_surveys').all(articlesPolicy.isAllowed)
    .get(articles_surveys.list_surveys);

  app.route('/api/articles_surveys/load_survey').all(articlesPolicy.isAllowed)
    .post(articles_surveys.load_survey);

  app.route('/api/articles_surveys/add_article').all(articlesPolicy.isAllowed)
    .post(articles_surveys.add_article);

  app.route('/api/articles_surveys/close_survey_order').all(articlesPolicy.isAllowed)
    .post(articles_surveys.close_survey_order);

  // Articles Prices Routes.
  app.route('/api/articles_prices').all(articlesPolicy.isAllowed)
    .get(articles_prices.list_prices);

  app.route('/api/articles_prices/load_price').all(articlesPolicy.isAllowed)
    .post(articles_prices.load_price);

  app.route('/api/articles_prices/enable_article').all(articlesPolicy.isAllowed)
    .post(articles_prices.enable_article);

  //Gondola routes
  app.route('/api/articles_gondola').all(articlesPolicy.isAllowed)
    .get(articles_gondola.list_articles_gondola);

  //Basket routes
  app.route('/api/articles_basket/list_basket').all(articlesPolicy.isAllowed)
    .get(articles_basket.list_basket);

  app.route('/api/articles_basket/add_article').all(articlesPolicy.isAllowed)
    .post(articles_basket.add_article);

  app.route('/api/articles_basket/sub_article').all(articlesPolicy.isAllowed)
    .post(articles_basket.sub_article);

  app.route('/api/articles_basket/remove_article').all(articlesPolicy.isAllowed)
    .post(articles_basket.remove_article);

  app.route('/api/articles_basket/close_basket').all(articlesPolicy.isAllowed)
    .post(articles_basket.close_basket);

  //Basket parameters routes

  //A) COUNT ADDRESS
  app.route('/api/basket_params/count_address').all(articlesPolicy.isAllowed)
    .get(parameters_basket.get_count_address);

  //B) SHIPPING CONDITIONS/COSTS
  app.route('/api/basket_params/list_shipping_costs').all(articlesPolicy.isAllowed)
    .get(parameters_cost_basket.list_shipping_costs);

  app.route('/api/basket_params/shipping_conditions').all(articlesPolicy.isAllowed)
    .get(parameters_cost_basket.get_shipping_conditions);

  app.route('/api/basket_params/shipping_conditions/update').all(articlesPolicy.isAllowed)
    .post(parameters_cost_basket.update_shipping_costs);

  //C) SHIPPING_TIMES
  app.route('/api/basket_params/list_shipping_times').all(articlesPolicy.isAllowed)
    .get(parameters_time_basket.list_shipping_times);

  app.route('/api/basket_params/get_shipping_times').all(articlesPolicy.isAllowed)
    .get(parameters_time_basket.get_shipping_times);

  app.route('/api/basket_params/shipping_times/add').all(articlesPolicy.isAllowed)
    .post(parameters_time_basket.add_shipping_times);

  app.route('/api/basket_params/shipping_times/update').all(articlesPolicy.isAllowed)
    .post(parameters_time_basket.update_shipping_times);

  app.route('/api/basket_params/shipping_times/delete').all(articlesPolicy.isAllowed)
    .post(parameters_time_basket.delete_shipping_times);

  app.route('/api/basket_params/shipping_times/enable').all(articlesPolicy.isAllowed)
    .post(parameters_time_basket.enable_shipping_times);

  app.route('/api/basket_params/shipping_times/disable').all(articlesPolicy.isAllowed)
    .post(parameters_time_basket.disable_shipping_times);

  //D) SHIPPING DATES
  app.route('/api/basket_params/list_shipping_dates').all(articlesPolicy.isAllowed)
    .get(parameters_date_basket.list_shipping_dates);

  app.route('/api/basket_params/get_shipping_dates').all(articlesPolicy.isAllowed)
    .get(parameters_date_basket.get_shipping_dates);

  app.route('/api/basket_params/shipping_dates/add').all(articlesPolicy.isAllowed)
    .post(parameters_date_basket.add_shipping_dates);

  app.route('/api/basket_params/shipping_dates/delete').all(articlesPolicy.isAllowed)
    .post(parameters_date_basket.delete_shipping_dates);
  
  app.route('/api/basket_params/shipping_dates/enable').all(articlesPolicy.isAllowed)
    .post(parameters_date_basket.enable_shipping_dates);

  app.route('/api/basket_params/shipping_dates/disable').all(articlesPolicy.isAllowed)
    .post(parameters_date_basket.disable_shipping_dates);

  // Articles Stocks Routes.
  app.route('/api/articles_stocks').all(articlesPolicy.isAllowed)
    .get(articles_stocks.list_stocks);

  app.route('/api/articles_stocks/load_stock').all(articlesPolicy.isAllowed)
    .post(articles_stocks.load_stock);

  //Articles Marketing Routes
  app.route('/api/articles_marketing').all(articlesPolicy.isAllowed)
    .get(articles_stocks.list_stocks);

  app.route('/api/articles_marketing/load_marketing').all(articlesPolicy.isAllowed)
    .post(articles_stocks.load_marketing);

  //Articles Consumption Routes
  app.route('/api/articles_consumption').all(articlesPolicy.isAllowed)
    .get(articles_stocks.list_stocks);

  app.route('/api/articles_consumption/load_consumption').all(articlesPolicy.isAllowed)
    .post(articles_stocks.load_consumption);

  // ComplexArticles Routes.
  app.route('/api/articles_complex').all(articlesPolicy.isAllowed)
    .get(articles_complex.list_complex)
    .post(articles_complex.create);

  app.route('/api/articles_complex/:complexArticleId').all(articlesPolicy.isAllowed)
    .get(articles_complex.read)
    .put(articles_complex.update);

  //Complex Article Images Route.
  app.route('/api/complex_articles_image/:complexArticleId').all(articlesPolicy.isAllowed)
    .get(articles_complex.read)
    .post(articles_complex.image);

  app.route('/api/articles_complex_actions/add_article').all(articlesPolicy.isAllowed)
    .post(articles_complex.add_article);

  app.route('/api/articles_complex_actions/remove_article').all(articlesPolicy.isAllowed)
    .post(articles_complex.remove_article);

  // Complex Articles Prices Routes.
  app.route('/api/complex_articles_prices').all(articlesPolicy.isAllowed)
    .get(articles_prices.list_prices_complex);

  app.route('/api/complex_articles_prices/load_price').all(articlesPolicy.isAllowed)
    .post(articles_prices.load_price_complex);

  app.route('/api/complex_articles_prices/enable_article').all(articlesPolicy.isAllowed)
    .post(articles_prices.enable_complex_article);

  // DeliveryOrder Routes.
  app.route('/api/deliveries').all(articlesPolicy.isAllowed)
    .get(deliveries.list_deliveries);

  app.route('/api/deliveries/:deliveryOrderId').all(articlesPolicy.isAllowed)
    .get(deliveries.read);

  app.route('/api/deliveries/:deliveryOrderId/change_article').all(articlesPolicy.isAllowed)
    .post(deliveries.change_article);

  app.route('/api/deliveries/:deliveryOrderId/add_gift').all(articlesPolicy.isAllowed)
    .post(deliveries.add_gift);

  app.route('/api/deliveries/:deliveryOrderId/update_article').all(articlesPolicy.isAllowed)
    .post(deliveries.update_article);

  app.route('/api/deliveries/:deliveryOrderId/remove_article').all(articlesPolicy.isAllowed)
    .post(deliveries.remove_article);

  app.route('/api/deliveries/:deliveryOrderId/close_delivery_order').all(articlesPolicy.isAllowed)
    .post(deliveries.close_delivery_order);

  // Configurar el parámetro middleware 'articleId'
  app.param('articleId', articles.articleByID);
  app.param('complexArticleId', articles_complex.complexArticleByID);
  app.param('purchaseOrderId', articles_purchases.purchaseOrderByID);
  app.param('deliveryOrderId', deliveries.deliveryOrderByID);
  app.param('shippingTimesId', parameters_time_basket.shippingTimesByID);
  app.param('shippingCostsId', parameters_cost_basket.shippingCostsByID);
};
