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
 * Create a Group
 */
exports.create = function(req, res) {
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    var group = {
      name: req.body.name,
      description: req.body.description,
      complex: req.body.complex                    
    };
    //Se busca el codigo mas alto para crear el grupo con el codigo que corresponda.
    var max_code = 0;
    var qry = 'SELECT MAX(code) code FROM grupo ';
    connection.query(qry, [], function(err, maxResult) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      if(maxResult.length){
        max_code = maxResult[0].code;
        if(max_code >= 99){
          return res.status(400).send({
            message: 'Ya no se pueden crear grupos.'
          });
        }
      }
      group.code = max_code + 1;
      qry = 'INSERT INTO grupo SET ? ';
      connection.query(qry, group, function(err, result) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        group.id_group = result.insertId;
        res.jsonp(group);
      });
    });
  });
};

/**
 * Show the current Group
 */
exports.read = function(req, res) {
  var group = req.group ? req.group : {};
  res.jsonp(group);
};

/**
 * Update a Group
 */
exports.update = function(req, res) {
  var group = req.group;
  group = _.extend(group , req.body);
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    var group_update = {
      name: group.name,
      description: group.description,
      id_status: group.id_status
    };
    var qry = 'UPDATE grupo SET ?, modified = NOW() WHERE id_group = ? ';
    var qry_callback = connection.query(qry, [group_update, group.id_group], function(err, result) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      console.log(qry_callback.sql);
      res.jsonp(group);
    });
  });
};

/**
 * Delete an Group
 */
exports.delete = function(req, res) {
  var group = req.group ;
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    var qry = 'UPDATE grupo SET id_status = ?, modified = NOW() WHERE id_group = ? ';
    connection.query(qry, [globals.NO_ACTIVO, group.id_group], function(err, result) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      group.id_status = globals.NO_ACTIVO;
      res.jsonp(group);
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
    qry += '  g.*, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  grupo g ';
    qry += '  JOIN status st USING(id_status) ';
    qry += 'ORDER BY g.name;';
    connection.query(qry, [], function(err, groups) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.jsonp(groups);
    });
  });
};

/**
 * List of Groups
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
    var order_by = mysql_helper.getOrderBy('g.name', req.query.sorting);
    
    //LIMIT.
    var rtdo_limit_pag = mysql_helper.getLimitAndPagination(page, count);
    var pagination = rtdo_limit_pag.pagination;
    var limit = rtdo_limit_pag.limit;

    var qry = '';
    qry += 'SELECT ';
    qry += '  COUNT(*) total_count ';
    qry += 'FROM ';
    qry += '  grupo g ';
    qry += '  JOIN status st USING(id_status) ';
    qry += where;
    qry += '; ';
    qry += 'SELECT ';
    qry += '  g.*, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  grupo g ';
    qry += '  JOIN status st USING(id_status) ';
    qry += where;
    qry += order_by;
    qry += limit;
    var qry_callback = connection.query(qry, [], function(err, results) {
      console.log(qry_callback.sql);
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      
      var total_count = 0;
      if(results[0].length){
        total_count = results[0][0].total_count;
      }
      var groups = results[1];
      var result = mysql_helper.getResult(groups, total_count, pagination);

      res.jsonp(result);
    });
  }); 
};

/**
 * Group middleware
 */
exports.groupByID = function(req, res, next, id_group) {
  req.getConnection(function(err, connection) {
    if (err) {
      return next(err);
    }
    var qry = '';
    qry += 'SELECT ';
    qry += '  g.*, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  grupo g  ';
    qry += '  JOIN status st USING(id_status) ';
    qry += 'WHERE ';
    qry += '  g.id_group = ? ';
    connection.query(qry, [id_group], function(err, groups) {
      if (err) {
        return next(err);
      } else if (!groups.length) {
        return res.status(404).send({
          message: 'No se ha encontrado el grupo.'
        });
      }
      req.group = groups[0];
      next();
    });
  });
};