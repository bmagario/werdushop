'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  globals = require(path.resolve('.','./config/globals')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');


/**
 * Show the current Location
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var location = req.location ? req.location : {};
  res.jsonp(location);
};

/**
 * List of Locations
 */
exports.list = function(req, res) {
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    var qry_callback = '';
    var qry = '';
    qry += 'SELECT ';
    qry += '  l.*, ';
    qry += '  CONCAT(l.name , " (", p.name, ")") full_location_name, ';
    qry += '  p.name province_name, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  location l ';
    qry += '  JOIN status st USING(id_status) ';
    qry += '  JOIN province p USING(id_province) ';
    qry += 'WHERE ';
    qry += '  st.id_status = ? ';
    qry += 'ORDER BY l.name;';
    qry_callback = connection.query(qry, [globals.ACTIVO], function(err, locations) {
      console.log(qry_callback.sql);
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.jsonp(locations);
    });
  });
};

exports.get_name_location = function(req, res) {
  if(req.query !== undefined && req.query !== null) {

    req.getConnection(function(err, connection) {
      if(err) {
        console.log(err);
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      }
    
      var id_location = req.query.id_location;
      var qry = '';
      var qry_callback = '';
    
      qry = 'SELECT name FROM location WHERE id_location = ?;';
      
      qry_callback = connection.query(qry, [id_location], function(err, location_name) {
        if(err) {
          console.log(err);
          return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
        }
        res.jsonp({location_name});
      });
    });
  }
};
