'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  globals = require(path.resolve('.','./config/globals')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');


/**
 * Show the current Zone
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var zone = req.zone ? req.zone : {};
  res.jsonp(zone);
};

/**
 * List of Zones
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
    qry += '  z.id_zone, ';
    qry += '  z.name zone_name, ';
    qry += '  CONCAT(l.name, " (", p.name, ") - ", z.name)  full_zone_name, ';
    qry += '  l.* ';
    qry += 'FROM ';
    qry += '  zone z ';
    qry += '  JOIN status st USING(id_status) ';
    qry += '  JOIN location l USING(id_location) ';
    qry += '  JOIN province p USING(id_province) ';
    qry += 'WHERE ';
    qry += '  st.id_status = ? ';
    qry += 'ORDER BY l.name;';
    qry_callback = connection.query(qry, [globals.ACTIVO], function(err, zones) {
      /*console.log(qry_callback.sql);*/
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.jsonp(zones);
    });
  });
};

exports.get_name_zone = function(req, res) {
  if(req.query !== undefined && req.query !== null) {

    req.getConnection(function(err, connection) {
      if(err) {
        console.log(err);
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      }

      var id_zone = req.query.id_zone;
      var qry = '';
      var qry_callback = '';
    
      qry = 'SELECT name FROM zone WHERE id_zone = ?;';
      
      qry_callback = connection.query(qry, [id_zone], function(err, zone_name) {
        if(err) {
          console.log(err);
          return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
        }

        res.jsonp({zone_name});
      });
    });
  }
};
