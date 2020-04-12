'use strict';

/**
 * Module dependencies
 */
var acl = require('acl');

// Using the memory backend
acl = new acl(new acl.memoryBackend());

/**
 * Invoke Articles Permissions
 */
exports.invokeRolesPolicies = function() {
  acl.allow([{
    roles: [ 'guest' ],
    allows: [{
      resources: '/api/articles_gondola',
      permissions: 'get'
    }/*,{
      resources: '/api/articles_basket/list_basket',
      permissions: 'get'
    },{
        resources: '/api/basket_params/shipping_times/get_shipping_times',
        permissions: 'get'
      }*/]
  },{
    roles: [ 'admin' ],
    allows: [{
      resources: '/api/articles',
      permissions: '*'
    }, {
      resources: '/api/articles/get_articles',
      permissions: '*'
    }, {
      resources: '/api/articles/:articleId',
      permissions: '*'
    }, {
      resources: '/api/articles_image',
      permissions: '*'
    }, {
      resources: '/api/articles_image/:articleId',
      permissions: '*'
    }, {//Compras.
      resources: '/api/articles_purchases',
      permissions: '*'
    }, {
      resources: '/api/articles_purchases/add_purchase_order',
      permissions: '*'
    }, {
      resources: '/api/articles_purchases/get_articles',
      permissions: '*'
    }, {
      resources: '/api/articles_purchases/get_payments',
      permissions: '*'
    }, {
      resources: '/api/articles_purchases/:purchaseOrderId',
      permissions: '*'
    }, {
      resources: '/api/articles_purchases/:purchaseOrderId/load_purchase',
      permissions: '*'
    }, {
      resources: '/api/articles_purchases/:purchaseOrderId/add_article',
      permissions: '*'
    }, {
      resources: '/api/articles_purchases/:purchaseOrderId/add_payment_method',
      permissions: '*'
    }, {
      resources: '/api/articles_purchases/:purchaseOrderId/update_payment_method',
      permissions: '*'
    }, {
      resources: '/api/articles_purchases/:purchaseOrderId/remove_payment_method',
      permissions: '*'
    }, {
      resources: '/api/articles_purchases/:purchaseOrderId/check_consistency',
      permissions: '*'
    }, {
      resources: '/api/articles_purchases/:purchaseOrderId/load_provider',
      permissions: '*'
    }, {
      resources: '/api/articles_purchases/:purchaseOrderId/close_purchase_order',
      permissions: '*'
    }, {//Relevamiento Precios.
      resources: '/api/articles_surveys',
      permissions: '*'
    }, {
      resources: '/api/articles_surveys/load_survey',
      permissions: '*'
    }, {
      resources: '/api/articles_surveys/add_article',
      permissions: '*'
    }, {
      resources: '/api/articles_surveys/close_survey_order',
      permissions: '*'
    }, {//Precios.
      resources: '/api/articles_prices',
      permissions: '*'
    }, {
      resources: '/api/articles_prices/enable_article',
      permissions: '*'
    }, {
      resources: '/api/articles_prices/load_price',
      permissions: '*'
    }, {
      resources: '/api/articles_gondola',
      permissions: '*'
    },{//Basket
      resources: '/api/articles_basket/list_basket',
      permissions: 'get'
    },{
      resources: '/api/articles_basket/add_article',
      permissions: '*'
    },{
      resources: '/api/articles_basket/sub_article',
      permissions: '*'
    },{
      resources: '/api/articles_basket/remove_article',
      permissions: '*'
    }, {
      resources: '/api/articles_basket/close_basket',
      permissions: '*'
    }, {//Basket Parameters
      resources: '/api/basket_params',
      permissions: '*'
    }, {
      resources: '/api/basket_params/count_address',
      permissions: '*'
    }, {
      resources: '/api/basket_params/shipping_conditions',
      permissions: '*'
    }, {
      resources: '/api/basket_params/shipping_conditions/update',
      permissions: '*'
    },{
      resources: '/api/basket_params/list_shipping_costs',
      permissions: 'get'
    }, {
      resources: '/api/basket_params/list_shipping_times',
      permissions: 'get'
    }, {
      resources: '/api/basket_params/shipping_times/add',
      permissions: '*'
    },{
      resources: '/api/basket_params/get_shipping_times',
      permissions: 'get'
    }, {
      resources: '/api/basket_params/shipping_times/update',
      permissions: 'post'
    }, {
      resources: '/api/basket_params/shipping_times/delete',
      permissions: 'post'
    }, {
      resources: '/api/basket_params/shipping_times/enable',
      permissions: 'post'
    }, {
      resources: '/api/basket_params/shipping_times/disable',
      permissions: 'post'
    }, {//shipping_dates
      resources: '/api/basket_params/list_shipping_dates',
      permissions: 'get'
    }, {
      resources: '/api/basket_params/shipping_dates/add',
      permissions: '*'
    }, {
      resources: '/api/basket_params/shipping_dates/delete',
      permissions: 'post'
    }, {
      resources: '/api/basket_params/get_shipping_dates',
      permissions: 'get'
    }, {
      resources: '/api/basket_params/shipping_dates/enable',
      permissions: 'post'
    }, {
      resources: '/api/basket_params/shipping_dates/disable',
      permissions: 'post'
    }, {//Stock.
      resources: '/api/articles_stocks',
      permissions: '*'
    }, {
      resources: '/api/articles_stocks/load_stock',
      permissions: '*'
    }, {//Marketing.
      resources: '/api/articles_marketing',
      permissions: '*'
    }, {
      resources: '/api/articles_marketing/load_marketing',
      permissions: '*'
    }, {//Consumption.
      resources: '/api/articles_consumption',
      permissions: '*'
    }, {
      resources: '/api/articles_consumption/load_consumption',
      permissions: '*'
    }, {
      resources: '/api/articles_complex',
      permissions: '*'
    }, {
      resources: '/api/articles_complex/:complexArticleId',
      permissions: '*'
    }, {
      resources: '/api/complex_articles_image',
      permissions: '*'
    }, {
      resources: '/api/complex_articles_image/:complexArticleId',
      permissions: '*'
    }, {
      resources: '/api/articles_complex_actions/add_article',
      permissions: '*'
    }, {
      resources: '/api/articles_complex_actions/remove_article',
      permissions: '*'
    }, {//Precios Articulos Complejos.
      resources: '/api/complex_articles_prices',
      permissions: '*'
    }, {
      resources: '/api/complex_articles_prices/enable_article',
      permissions: '*'
    }, {
      resources: '/api/complex_articles_prices/load_price',
      permissions: '*'
    }, {
      resources: '/api/deliveries',
      permissions: '*'
    }, {
      resources: '/api/deliveries/:deliveryOrderId',
      permissions: '*'
    }, {
      resources: '/api/deliveries/:deliveryOrderId/change_article',
      permissions: '*'
    }, {
      resources: '/api/deliveries/:deliveryOrderId/add_gift',
      permissions: '*'
    }, {
      resources: '/api/deliveries/:deliveryOrderId/update_article',
      permissions: '*'
    }, {
      resources: '/api/deliveries/:deliveryOrderId/remove_article',
      permissions: '*'
    }, {
      resources: '/api/deliveries/:deliveryOrderId/load_delivery',
      permissions: '*'
    }, {
      resources: '/api/deliveries/:deliveryOrderId/close_delivery_order',
      permissions: '*'
    }]
  }, {
    roles: [ 'user' ],
    allows: [
      {
        resources: '/api/articles_gondola',
        permissions: '*'
      },{
        resources: '/api/articles_basket/list_basket',
        permissions: 'get'
      },{
        resources: '/api/articles_basket/add_article',
        permissions: '*'
      },{
        resources: '/api/articles_basket/sub_article',
        permissions: '*'
      },{
        resources: '/api/articles_basket/remove_article',
        permissions: '*'
      },{
        resources: '/api/articles_basket/close_basket',
        permissions: '*'
      },{
        resources: '/api/basket_params/get_shipping_times',
        permissions: 'get'
      },{
        resources: '/api/basket_params/get_shipping_dates',
        permissions: 'get'
      },{
        resources: '/api/basket_params/shipping_conditions',
        permissions: 'get'
      }]
  }]);
};

/**
 * Check If Articles Policy Allows
 */
exports.isAllowed = function (req, res, next) {
  var roles = (req.user) ? req.user.roles : [ 'guest' ];
  console.log('Articles roles = ');console.log(roles);
  // Check for user roles
  acl.areAnyRolesAllowed(roles, req.route.path, req.method.toLowerCase(), function (err, isAllowed) {
    if (err) {
      // An authorization error occurred
      return res.status(500).send('Error de autorización inesperado');
    } else {
      console.log('Articles isAllowed = ');console.log(isAllowed);
      if (isAllowed) {
        // Access granted! Invoke next middleware
        return next();
      } else {
        return res.status(403).json({
          message: 'Usuario no autorizado.'
        });
      }
    }
  });
};
