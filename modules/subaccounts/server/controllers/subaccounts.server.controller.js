'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  async = require('async'),
  globals = require(path.resolve('.','./config/globals')),
  mysql_helper = require(path.resolve('.','./config/mysql_helper')),
  shared = require(path.resolve('.','./config/shared')),
  multer = require('multer'),
  config = require(path.resolve('./config/config')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

/**
 * Create an Subaccount
 */
exports.create = function(req, res) {
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    var qry = '';
    var qry_callback = '';
    var subaccount = {
      description: req.body.description,
      id_account: req.body.id_account,
      id_status: req.body.id_status,
      id_user_created: req.user.id_user
    };
    qry = 'INSERT INTO subaccount SET ?; ';
    connection.query(qry, subaccount, function(err, result) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      subaccount.id_subaccount = result.insertId;
      res.jsonp(subaccount);
    });
  });
};

/**
 * Show the current Subaccount
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var subaccount = req.subaccount ? req.subaccount : {};
  res.jsonp(subaccount);
};

/**
 * Update an Subaccount
 */
exports.update = function(req, res) {
  var subaccount = req.subaccount ;

  //Se explaya el valor del form en el objeto subaccount.
  subaccount = _.extend(subaccount , req.body);
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    var subaccount_update = {
      description: subaccount.description,
      id_account: subaccount.id_account,
      id_status: subaccount.id_status,
      id_user_modified: req.user.id_user
    };
    var qry = 'UPDATE subaccount SET ?, modified = NOW() WHERE id_subaccount = ' + connection.escape(subaccount.id_subaccount);
    connection.query(qry, subaccount_update, function(err, result) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.jsonp(subaccount);
    });
  });
};

/**
 * Delete an Subaccount
 */
exports.delete = function(req, res) {
  var subaccount = req.subaccount ;
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    var qry = 'UPDATE subaccount SET id_status = ?, id_user_modified = ?, modified = NOW() WHERE id_subaccount = ?; ';
    connection.query(qry, [globals.NO_ACTIVO, req.user.id_user, subaccount.id_subaccount], function(err, result) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      subaccount.id_status = globals.NO_ACTIVO;
      res.jsonp(subaccount);
    });
  });
};

/**
 * List of Subaccounts
 */
var listAll = function(req, res) {
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    var qry = '';
    qry += 'SELECT ';
    qry += '  sacc.*,  ';
    qry += '  acc.description acc_description,  ';
    qry += '  acc.account_type, ';
    qry += '  IF(acc.account_type = ' + globals.INGRESO + ', "INGRESO", "EGRESO") tipo_cuenta, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  subaccount sacc ';
    qry += '  JOIN status st  USING(id_status) ';
    qry += '  JOIN account acc USING(id_account) ';
    qry += 'WHERE ';
    qry += '  sacc.id_status = ? ';
    qry += '  AND acc.id_status = ? ';
    qry += 'ORDER BY sacc.description;';
    connection.query(qry, [globals.ACTIVO, globals.ACTIVO], function(err, subaccounts) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.jsonp(subaccounts);
    });
  });
};

/**
 * List of Subaccounts
 */
exports.list = function(req, res) {
  //Si se pregunta por todos los subgrupos sin ningun tipo de filtro.
  if(req.query.all !== undefined || req.query.no_complex !== undefined || req.query.complex !== undefined){
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
    var order_by = mysql_helper.getOrderByAccount('sacc.description', req.query.sorting);

    //LIMIT.
    var rtdo_limit_pag = mysql_helper.getLimitAndPagination(page, count);
    var pagination = rtdo_limit_pag.pagination;
    var limit = rtdo_limit_pag.limit;

    var qry = '';
    qry += 'SELECT ';
    qry += '  COUNT(*) total_count ';
    qry += 'FROM ';
    qry += '  subaccount sacc ';
    qry += '  JOIN status st  USING(id_status) ';
    qry += '  JOIN account acc USING(id_account) ';
    qry += where;
    qry += '; ';
    qry += 'SELECT ';
    qry += '  sacc.*, ';
    qry += '  acc.description acc_description,  ';
    qry += '  acc.account_type, ';
    qry += '  IF(acc.account_type = ' + globals.INGRESO + ', "INGRESO", "EGRESO") tipo_cuenta, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  subaccount sacc ';
    qry += '  JOIN status st  USING(id_status) ';
    qry += '  JOIN account acc USING(id_account) ';
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
      var subaccounts = results[1];
      var result = mysql_helper.getResult(subaccounts, total_count, pagination);

      res.jsonp(result);
    });
  });
};

/**
 * Subaccounts middleware
 */
exports.subaccountByID = function(req, res, next, id_subaccount) {
  req.getConnection(function(err, connection) {
    if (err) {
      return next(err);
    }

    var qry = '';
    qry += 'SELECT ';
    qry += '  sacc.*, ';
    qry += '  acc.description acc_description, ';
    qry += '  acc.account_type, ';
    qry += '  IF(acc.account_type = ' + globals.INGRESO + ', "INGRESO", "EGRESO") tipo_cuenta, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  subaccount sacc ';
    qry += '  JOIN status st USING(id_status) ';
    qry += '  JOIN account acc USING(id_account) ';
    qry += 'WHERE ';
    qry += '  sacc.id_subaccount = ?; ';
    connection.query(qry, [id_subaccount], function(err, subaccounts) {
      if (err) {
        return next(err);
      } else if (!subaccounts.length) {
        return res.status(404).send({
          message: 'No se ha encontrado la subcuenta.'
        });
      }
      req.subaccount = subaccounts[0];
      next();
    });
  });
};

exports.get_subaccounts_users_providers = function(req, res){
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    var parametros = [];
    var qry_callback = '';
    var qry = '';

    //Subcuentas.
    qry += 'SELECT ';
    qry += '  acc.account_type type, ';
    qry += '  "EGRESO" tipo_cuenta, ';
    qry += '  CONCAT(acc.account_type, "-", sacc.id_subaccount) id_deuda, ';
    qry += '  sacc.description description_deuda, ';
    qry += '  sacc.id_subaccount, ';
    qry += '  NULL id_user_payment, ';
    qry += '  NULL id_provider_payment ';
    qry += 'FROM ';
    qry += '  subaccount sacc ';
    qry += '  JOIN status st  USING(id_status) ';
    qry += '  JOIN account acc USING(id_account) ';
    qry += 'WHERE ';
    qry += '  sacc.id_status = ? ';
    qry += '  AND acc.id_status = ? ';
    qry += '  AND acc.account_type = ? ';
    parametros.push(globals.ACTIVO);
    parametros.push(globals.ACTIVO);
    parametros.push(globals.EGRESO);

    //Deudas Usuarios.
    qry += 'UNION ';
    qry += 'SELECT ';
    qry += '  ? type, ';
    qry += '  "USUARIOS" tipo_cuenta, ';
    qry += '  CONCAT(?, "-", u.id_user) id_deuda, ';
    qry += '  CONCAT(u.first_name, " ", u.last_name, " ($", SUM(upd.amount * upd.sign) ,")") description_deuda, ';
    qry += '  NULL id_subaccount, ';
    qry += '  up.id_user_payment, ';
    qry += '  NULL id_provider_payment ';
    qry += 'FROM ';
    qry += '  user u ';
    qry += '  JOIN user_payment up USING(id_user) ';
    qry += '  JOIN user_payment_detail upd USING(id_user_payment) ';
    qry += 'WHERE ';
    qry += '  up.id_payment_method = ? ';
    qry += 'GROUP BY up.id_user_payment ';
    qry += 'HAVING SUM(upd.amount * upd.sign) > 0 ';
    parametros.push(globals.USERS);
    parametros.push(globals.USERS);
    parametros.push(globals.PAGOS.CTA_CORRIENTE);

    //Deudas Proveedores.
    qry += 'UNION ';
    qry += 'SELECT ';
    qry += '  ? type, ';
    qry += '  "PROVEEDORES" tipo_cuenta, ';
    qry += '  CONCAT(?, "-", p.id_provider) id_deuda, ';
    qry += '  CONCAT(p.nombre_fantasia, "( $", SUM(ppd.amount * ppd.sign) ,")") description_deuda, ';
    qry += '  NULL id_subaccount, ';
    qry += '  NULL id_user_payment, ';
    qry += '  pp.id_provider_payment ';
    qry += 'FROM ';
    qry += '  provider p ';
    qry += '  JOIN provider_payment pp USING(id_provider) ';
    qry += '  JOIN provider_payment_detail ppd USING(id_provider_payment) ';
    qry += 'WHERE ';
    qry += '  pp.id_payment_method = ? ';
    qry += 'GROUP BY pp.id_provider_payment ';
    qry += 'HAVING SUM(ppd.amount * ppd.sign) > 0 ';
    parametros.push(globals.PROVIDERS);
    parametros.push(globals.PROVIDERS);
    parametros.push(globals.PAGOS.CTA_CORRIENTE);

    qry += 'ORDER BY type, description_deuda; ';

    qry_callback = connection.query(qry, parametros, function(err, results) {
      console.log(qry_callback.sql);
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }

      res.jsonp(results);
    });
  });
};
