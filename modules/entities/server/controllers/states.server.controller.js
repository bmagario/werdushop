'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');


/**
 * Show the current State
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var state = req.state ? req.state : {};
  res.jsonp(state);
};


/**
 * List of States
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
    qry += '  st.id_status, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  status ';
    qry += 'ORDER BY st.name;';
    connection.query(qry, [], function(err, status) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.jsonp(status);
    });
  });
};