'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  globals = require(path.resolve('.','./config/globals')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');


/**
 * Show the current MeasurementUnit
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var measurement_unit = req.state ? req.measurement_unit : {};
  res.jsonp(measurement_unit);
};

/**
 * List of MeasurementUnit
 */
exports.list = function(req, res) { 
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    var qry = '';
    qry += 'SELECT ';
    qry += '  mu.*, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  measurement_unit mu ';
    qry += '  JOIN status st USING(id_status) ';
    qry += 'WHERE ';
    qry += '  st.id_status = ? ';
    qry += 'ORDER BY mu.name;';
    connection.query(qry, [globals.ACTIVO], function(err, measurement_units) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.jsonp(measurement_units);
    });
  });
};