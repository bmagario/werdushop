'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  globals = require(path.resolve('.','./config/globals')),
  mysql_helper = require(path.resolve('.','./config/mysql_helper')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

/**
 * Create a Brand
 */
exports.create = function(req, res) {
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    var brand = {
      name: req.body.name,
      description: req.body.description
    };
    var qry = 'INSERT INTO brand SET ? ';
    connection.query(qry, brand, function(err, result) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      brand.id_brand = result.insertId;
      res.jsonp(brand);
    });
  });
};

/**
 * Show the current Brand
 */
exports.read = function(req, res) {
  var brand = req.brand ? req.brand : {};
  res.jsonp(brand);
};

/**
 * Update a Brand
 */
exports.update = function(req, res) {
  var brand = req.brand ;
  brand = _.extend(brand , req.body);
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    var brand_update = {
      name: brand.name,
      description: brand.description,
      id_status: brand.id_status
    };
    var qry = 'UPDATE brand SET ?, modified = NOW() WHERE id_brand = ? ';
    var qry_callback = connection.query(qry, [brand_update, brand.id_brand], function(err, result) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.jsonp(brand);
    });
  });
};

/**
 * Delete an Brand
 */
exports.delete = function(req, res) {
  var brand = req.brand ;
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    var qry = 'UPDATE brand SET id_status = ?, modified = NOW() WHERE id_brand = ? ';
    connection.query(qry, [globals.NO_ACTIVO, brand.id_brand], function(err, result) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      brand.id_status = globals.NO_ACTIVO;
      res.jsonp(brand);
    });
  });
};

var listAll = function(req, res) { 
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    var qry = '';
    qry += 'SELECT ';
    qry += '  b.*, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  brand b ';
    qry += '  JOIN status st USING(id_status) ';
    qry += 'ORDER BY b.name;';
    connection.query(qry, [], function(err, brands) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.jsonp(brands);
    });
  });
};

/**
 * List of Brands
 */
exports.list = function(req, res) { 
  if(req.query.all !== undefined){
    return listAll(req, res);
  }

  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    var count = req.query.count || 5;
    var page = req.query.page || 1;

    //WHERE.
    var where = mysql_helper.getWhereFilterArticles(connection, req.query.filter);    
    
    //ORDER BY.
    var order_by = mysql_helper.getOrderBy('b.name', req.query.sorting);
    
    //LIMIT.
    var rtdo_limit_pag = mysql_helper.getLimitAndPagination(page, count);
    var pagination = rtdo_limit_pag.pagination;
    var limit = rtdo_limit_pag.limit;

    var qry = '';
    qry += 'SELECT ';
    qry += '  COUNT(*) total_count ';
    qry += 'FROM ';
    qry += '  brand b ';
    qry += '  JOIN status st USING(id_status) ';
    qry += where;
    qry += '; ';
    qry += 'SELECT ';
    qry += '  b.*, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  brand b ';
    qry += '  JOIN status st USING(id_status) ';
    qry += where;
    qry += order_by;
    qry += limit;
    var qry_callback = connection.query(qry, [], function(err, results) {
      /*console.log(qry_callback.sql);*/
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      
      var total_count = 0;
      if(results[0].length){
        total_count = results[0][0].total_count;
      }
      var brands = results[1];
      var result = mysql_helper.getResult(brands, total_count, pagination);

      res.jsonp(result);
    });
  }); 
};

/**
 * Brand middleware
 */
exports.brandByID = function(req, res, next, id_brand) {
  req.getConnection(function(err, connection) {
    if (err) {
      return next(err);
    }
    var qry = '';
    qry += 'SELECT ';
    qry += '  b.*, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  brand b  ';
    qry += '  JOIN status st USING(id_status) ';
    qry += 'WHERE ';
    qry += '  b.id_brand = ? ';
    connection.query(qry, [id_brand], function(err, brands) {
      if (err) {
        return next(err);
      } else if (!brands.length) {
        return res.status(404).send({
          message: 'No se ha encontrado la marca.'
        });
      }
      req.brand = brands[0];
      next();
    });
  });
};