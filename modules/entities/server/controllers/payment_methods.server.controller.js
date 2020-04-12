'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  globals = require(path.resolve('.','./config/globals')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');


/**
 * Show the current Payment Method
 */
exports.read = function(req, res) {
  var payment_method = req.payment_method ? req.payment_method : {};
  res.jsonp(payment_method);
};

/**
 * List of payment_methods
 */
exports.list = function(req, res) {
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    var payment_type = globals.PAYMENT_METHOD_AMBOS;
    if(req.query.payment_type){
      payment_type = req.query.payment_type;
    }

    var qry_callback = '';
    var qry = '';
    qry += 'SELECT ';
    qry += '  p.id_payment_method, ';
    qry += '  p.description, ';
    qry += '  p.payment_type, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  payment_method p ';
    qry += '  JOIN status st USING(id_status) ';
    qry += 'WHERE ';
    qry += '  (p.payment_type = ? OR p.payment_type = ?) ';
    qry += '  AND st.id_status = ? ';
    qry += 'ORDER BY p.orden, p.description;';
    qry_callback = connection.query(qry, [globals.PAYMENT_METHOD_AMBOS, payment_type, globals.ACTIVO], function(err, payment_methods) {
      console.log(qry_callback.sql);
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.jsonp(payment_methods);
    });
  });
};
