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
 * Create an Account
 */
exports.create = function(req, res) {
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    var account = {
      description: req.body.description,
      account_type: req.body.account_type,
      id_status: req.body.id_status,
      id_user_created: req.user.id_user
    };
    var qry = '';
    qry = 'INSERT INTO account SET ?; ';
    connection.query(qry, account, function(err, result) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      account.id_account = result.insertId;
      res.jsonp(account);
    });
  });
};

/**
 * Show the current Account
 */
exports.read = function(req, res) {
  var account = req.account ? req.account : {};
  res.jsonp(account);
};

/**
 * Update Account
 */
exports.update = function(req, res) {
  var account = req.account;
  account = _.extend(account , req.body);
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    var account_update = {
      description: req.body.description,
      account_type: req.body.account_type,
      id_status: req.body.id_status,
      id_user_modified: req.user.id_user
    };
    var qry = 'UPDATE account SET ?, modified = NOW() WHERE id_account = ? ';
    var qry_callback = connection.query(qry, [account_update, account.id_account], function(err, result) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.jsonp(account);
    });
  });
};

/**
 * Delete an Account
 */
exports.delete = function(req, res) {
  var account = req.account ;
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    var qry = 'UPDATE account SET id_status = ?, id_user_modified = ?, modified = NOW() WHERE id_account = ?; ';
    connection.query(qry, [globals.NO_ACTIVO, req.user.id_user, account.id_account], function(err, result) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      account.id_status = globals.NO_ACTIVO;
      res.jsonp(account);
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
    qry += '  acc.*, ';
    qry += '  IF(acc.account_type = ' + globals.INGRESO + ', "INGRESO", "EGRESO") tipo_cuenta, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  account acc ';
    qry += '  JOIN status st USING(id_status) ';
    qry += 'WHERE ';
    qry += '  acc.id_status = ? ';
    qry += 'ORDER BY acc.description;';
    connection.query(qry, [globals.ACTIVO], function(err, accounts) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.jsonp(accounts);
    });
  });
};

/**
 * List of Accounts
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
    var where = mysql_helper.getWhereFilterAccount(connection, req.query.filter);

    //ORDER BY.
    var order_by = mysql_helper.getOrderByAccount('acc.description', req.query.sorting);

    //LIMIT.
    var rtdo_limit_pag = mysql_helper.getLimitAndPagination(page, count);
    var pagination = rtdo_limit_pag.pagination;
    var limit = rtdo_limit_pag.limit;

    var qry = '';
    qry += 'SELECT ';
    qry += '  COUNT(*) total_count ';
    qry += 'FROM ';
    qry += '  account acc ';
    qry += '  JOIN status st USING(id_status) ';
    qry += where;
    qry += '; ';
    qry += 'SELECT ';
    qry += '  acc.*, ';
    qry += '  IF(acc.account_type = ' + globals.INGRESO + ', "INGRESO", "EGRESO") tipo_cuenta, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  account acc ';
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
      var accounts = results[1];
      var result = mysql_helper.getResult(accounts, total_count, pagination);

      res.jsonp(result);
    });
  });
};

/**
 * Accounts middleware
 */
exports.cuentaByID = function(req, res, next, id_account) {
  req.getConnection(function(err, connection) {
    if (err) {
      return next(err);
    }
    var qry = '';
    qry += 'SELECT ';
    qry += '  acc.*, ';
    qry += '  IF(acc.account_type = ' + globals.INGRESO + ', "INGRESO", "EGRESO") tipo_cuenta, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  account acc ';
    qry += '  JOIN status st USING(id_status) ';
    qry += 'WHERE ';
    qry += '  acc.id_account = ?; ';
    connection.query(qry, [id_account], function(err, accounts) {
      if (err) {
        return next(err);
      } else if (!accounts.length) {
        return res.status(404).send({
          message: 'No se ha encontrado el cuenta.'
        });
      }
      req.account = accounts[0];
      next();
    });
  });
};
