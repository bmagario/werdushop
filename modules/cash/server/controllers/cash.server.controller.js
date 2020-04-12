'use strict';

/**
* Module dependencies.
*/
var path = require('path'),
  globals = require(path.resolve('.','./config/globals')),
  mysql_helper = require(path.resolve('.','./config/mysql_helper')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');


exports.get_cash = function(req, res){
  if(req.query.id_zone === undefined || req.query.id_zone === null){
    return res.status(400).send({
      message: 'Debe ingresar la zona.'
    });
  }

  var id_zone = req.query.id_zone;
  var qry = '';
  var qry_callback;
  var parametros = [];
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    var count = req.query.count || 5;
    var page = req.query.page || 1;

    //WHERE.
    var where = '';

    //ORDER BY.
    var order_by = mysql_helper.getOrderByCash('cash_type', req.query.sorting);

    //LIMIT.
    var rtdo_limit_pag = mysql_helper.getLimitAndPagination(page, count);
    var pagination = rtdo_limit_pag.pagination;
    var limit = rtdo_limit_pag.limit;

    //Temporal de la ultima caja.
    qry = 'DROP TEMPORARY TABLE IF EXISTS tmp_max_cash;';
    qry += 'CREATE TEMPORARY TABLE tmp_max_cash ';
    qry += 'SELECT ';
    qry += '  MAX(id_cash) id_cash ';
    qry += 'FROM ';
    qry += '  cash ';
    qry += 'WHERE ';
    qry += ' id_zone = ?; ';
    parametros.push(id_zone);

    //Total de la caja.
    qry += 'SELECT ';
    qry += '  cash.*, ';
    qry += '  (cash.start_cash_count - cash.start_amount) start_cash_count_diff, ';
    qry += '  cash.start_cash_count + IFNULL(SUM(saccd.amount * IF(acc.account_type = ' + globals.INGRESO + ', ' + globals.PAGOS.SUMA + ', ' + globals.PAGOS.RESTA + ')), 0) total ';
    qry += 'FROM ';
    qry += '  cash ';
    qry += '  JOIN tmp_max_cash tmc USING(id_cash) ';
    qry += '  LEFT JOIN cash_detail cd USING(id_cash) ';
    qry += '  LEFT JOIN subaccount_detail saccd USING(id_subaccount_detail) ';
    qry += '  LEFT JOIN subaccount sacc USING(id_subaccount) ';
    qry += '  LEFT JOIN account acc USING(id_account) ';
    qry += ';';

    //Detalle de la caja.
    qry += 'SELECT ';
    qry += '  COUNT(*) total_count ';
    qry += 'FROM ';
    qry += '  cash ';
    qry += '  JOIN tmp_max_cash tmc USING(id_cash) ';
    qry += '  JOIN cash_detail cd USING(id_cash) ';
    qry += '  JOIN subaccount_detail saccd USING(id_subaccount_detail) ';
    qry += '  JOIN subaccount sacc USING(id_subaccount) ';
    qry += '  JOIN account acc USING(id_account) ';
    qry += where;
    qry += ';';
    qry += 'SELECT ';
    qry += '  saccd.*,';
    qry += '  CASE ';
    qry += '    WHEN saccd.id_purchase_order IS NOT NULL THEN CONCAT("OC N° " , po.number, " - PROVEEDOR ", prov_po.nombre_fantasia) ';
    qry += '    WHEN saccd.id_basket_order IS NOT NULL THEN CONCAT("OE N° " , bo.number, " - CLIENTE ", CONCAT(user_bo.first_name, " " ,user_bo.last_name)) ';
    qry += '    WHEN saccd.id_user_payment IS NOT NULL THEN CONCAT("CTA. CTE. CLIENTE " , CONCAT(user_cta_cte.first_name, " " ,user_cta_cte.last_name)) ';
    qry += '    WHEN saccd.id_provider_payment IS NOT NULL THEN CONCAT("CTA. CTE. PROVEEDOR " , prov_cta_cte.nombre_fantasia) ';
    qry += '    ELSE sacc.description ';
    qry += '  END cash_detail_description, ';
    qry += '  CASE ';
    qry += '    WHEN saccd.id_purchase_order IS NOT NULL THEN "TOTAL PAGO COMPRAS" ';
    qry += '    WHEN saccd.id_basket_order IS NOT NULL THEN "TOTAL PAGO VENTAS" ';
    qry += '    WHEN saccd.id_user_payment IS NOT NULL THEN "TOTAL OTROS COBROS" ';
    qry += '    ELSE "TOTAL OTROS PAGOS" ';
    qry += '  END cash_type, ';
    qry += '  acc.description acc_description,  ';
    qry += '  acc.account_type, ';
    qry += '  cd.created cash_created, ';
    qry += '  IF(acc.account_type = ' + globals.INGRESO + ', "INGRESO", "EGRESO") tipo_cuenta ';
    qry += 'FROM ';
    qry += '  cash ';
    qry += '  JOIN tmp_max_cash tmc USING(id_cash) ';
    qry += '  JOIN cash_detail cd USING(id_cash) ';
    qry += '  JOIN subaccount_detail saccd USING(id_subaccount_detail) ';
    qry += '  JOIN subaccount sacc USING(id_subaccount) ';
    qry += '  JOIN account acc USING(id_account) ';

    qry += '  LEFT JOIN purchase_order po USING(id_purchase_order) ';
    qry += '  LEFT JOIN purchase_order_payment pop ON(pop.id_purchase_order = po.id_purchase_order AND pop.id_payment_method = ' + globals.PAGOS.CAJA + ') ';
    qry += '  LEFT JOIN provider prov_po ON(prov_po.id_provider = pop.id_provider) ';

    qry += '  LEFT JOIN basket_order bo USING(id_basket_order) ';
    qry += '  LEFT JOIN basket_order_payment bop ON(bop.id_basket_order = bo.id_basket_order AND bop.id_payment_method = ' + globals.PAGOS.CAJA + ') ';
    qry += '  LEFT JOIN user user_bo ON(user_bo.id_user = bo.id_user) ';

    qry += '  LEFT JOIN user_payment up USING(id_user_payment) ';
    qry += '  LEFT JOIN user user_cta_cte ON(user_cta_cte.id_user = up.id_user) ';

    qry += '  LEFT JOIN provider_payment pp USING(id_provider_payment) ';
    qry += '  LEFT JOIN provider prov_cta_cte ON(prov_cta_cte.id_provider = pp.id_provider) ';
    qry += where;
    qry += order_by;
    qry += limit;
    var qry_callback = connection.query(qry, parametros, function(err, results) {
      console.log(qry_callback.sql);
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }

      var cash_total = 0;
      var total_count = 0;
      var cash_result = [{ cash: {}, detail: [] }];
      if(results[3].length){
        total_count = results[3][0].total_count;
        cash_total = results[2][0];
      }

      var cash = results[4];
      var result = mysql_helper.getResult(cash, total_count, pagination);
      cash_result = [{ cash: cash_total, detail: result }];

      res.jsonp(cash_result);
    });
  });
};

exports.get_cash_history = function(req, res){
  if(req.query.id_zone === undefined || req.query.id_zone === null){
    return res.status(400).send({
      message: 'Debe ingresar la zona.'
    });
  }

  if(req.query.date_from === undefined || req.query.date_from === null ||
    req.query.date_to === undefined || req.query.date_to === null){
    return res.status(400).send({
      message: 'Debe ingresar las fechas desde y hasta.'
    });
  }

  var id_zone = req.query.id_zone;
  var date_from = req.query.date_from;
  var date_to = req.query.date_to;
  var qry = '';
  var qry_callback;
  var parametros = [];
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    var count = req.query.count || 5;
    var page = req.query.page || 1;

    //WHERE.
    var where = 'WHERE';
    where += '  cash_date BETWEEN ' + connection.escape(date_from) + ' AND '+ connection.escape(date_to);

    //ORDER BY.
    var order_by = mysql_helper.getOrderByCash('cash_type', req.query.sorting);

    //LIMIT.
    var rtdo_limit_pag = mysql_helper.getLimitAndPagination(page, count);
    var pagination = rtdo_limit_pag.pagination;
    var limit = rtdo_limit_pag.limit;

    //Se selecciona la minima caja entre las fechas.
    qry = 'SELECT ';
    qry += '  MIN(id_cash) ';
    qry += 'FROM ';
    qry += '  cash ';
    qry += 'WHERE ';
    qry += ' id_zone = ? ';
    qry += ' AND id_status = ? ';
    qry += ' AND cash_date >= ? ';
    qry += 'INTO @min_cash;';
    parametros.push(id_zone);
    parametros.push(globals.NO_ACTIVO);
    parametros.push(date_from);

    //Se selecciona la maxima caja entre las fechas.
    qry += 'SELECT ';
    qry += '  MAX(id_cash) ';
    qry += 'FROM ';
    qry += '  cash ';
    qry += 'WHERE ';
    qry += ' id_zone = ? ';
    qry += ' AND id_status = ? ';
    qry += ' AND cash_date <= ? ';
    qry += 'INTO @max_cash;';
    parametros.push(id_zone);
    parametros.push(globals.NO_ACTIVO);
    parametros.push(date_to);

    //Total de la caja.
    qry += 'SELECT ';
    qry += '  (SELECT start_amount FROM cash WHERE id_cash = @min_cash) start_amount, ';
    qry += '  (SELECT final_cash_count FROM cash WHERE id_cash = @max_cash) final_cash_count ';
    qry += ';';

    //Detalle de la caja.
    qry += 'SELECT ';
    qry += '  COUNT(*) total_count ';
    qry += 'FROM ';
    qry += '  cash ';
    qry += '  JOIN cash_detail cd USING(id_cash) ';
    qry += '  JOIN subaccount_detail saccd USING(id_subaccount_detail) ';
    qry += '  JOIN subaccount sacc USING(id_subaccount) ';
    qry += '  JOIN account acc USING(id_account) ';
    qry += where;
    qry += ';';
    qry += 'SELECT ';
    qry += '  saccd.*,';
    qry += '  CASE ';
    qry += '    WHEN saccd.id_purchase_order IS NOT NULL THEN CONCAT("OC N° " , po.number, " - PROVEEDOR ", prov_po.nombre_fantasia) ';
    qry += '    WHEN saccd.id_basket_order IS NOT NULL THEN CONCAT("OE N° " , bo.number, " - CLIENTE ", CONCAT(user_bo.first_name, " " ,user_bo.last_name)) ';
    qry += '    WHEN saccd.id_user_payment IS NOT NULL THEN CONCAT("CTA. CTE. CLIENTE " , CONCAT(user_cta_cte.first_name, " " ,user_cta_cte.last_name)) ';
    qry += '    WHEN saccd.id_provider_payment IS NOT NULL THEN CONCAT("CTA. CTE. PROVEEDOR " , prov_cta_cte.nombre_fantasia) ';
    qry += '    ELSE sacc.description ';
    qry += '  END cash_detail_description, ';
    qry += '  CASE ';
    qry += '    WHEN saccd.id_purchase_order IS NOT NULL THEN "TOTAL PAGO COMPRAS" ';
    qry += '    WHEN saccd.id_basket_order IS NOT NULL THEN "TOTAL PAGO VENTAS" ';
    qry += '    WHEN saccd.id_user_payment IS NOT NULL THEN "TOTAL OTROS COBROS" ';
    qry += '    ELSE "TOTAL OTROS PAGOS" ';
    qry += '  END cash_type, ';
    qry += '  acc.description acc_description,  ';
    qry += '  acc.account_type, ';
    qry += '  cd.created cash_created, ';
    qry += '  IF(acc.account_type = ' + globals.INGRESO + ', "INGRESO", "EGRESO") tipo_cuenta ';
    qry += 'FROM ';
    qry += '  cash ';
    qry += '  JOIN cash_detail cd USING(id_cash) ';
    qry += '  JOIN subaccount_detail saccd USING(id_subaccount_detail) ';
    qry += '  JOIN subaccount sacc USING(id_subaccount) ';
    qry += '  JOIN account acc USING(id_account) ';

    qry += '  LEFT JOIN purchase_order po USING(id_purchase_order) ';
    qry += '  LEFT JOIN purchase_order_payment pop ON(pop.id_purchase_order = po.id_purchase_order AND pop.id_payment_method = ' + globals.PAGOS.CAJA + ') ';
    qry += '  LEFT JOIN provider prov_po ON(prov_po.id_provider = pop.id_provider) ';

    qry += '  LEFT JOIN basket_order bo USING(id_basket_order) ';
    qry += '  LEFT JOIN basket_order_payment bop ON(bop.id_basket_order = bo.id_basket_order AND bop.id_payment_method = ' + globals.PAGOS.CAJA + ') ';
    qry += '  LEFT JOIN user user_bo ON(user_bo.id_user = bo.id_user) ';

    qry += '  LEFT JOIN user_payment up USING(id_user_payment) ';
    qry += '  LEFT JOIN user user_cta_cte ON(user_cta_cte.id_user = up.id_user) ';

    qry += '  LEFT JOIN provider_payment pp USING(id_provider_payment) ';
    qry += '  LEFT JOIN provider prov_cta_cte ON(prov_cta_cte.id_provider = pp.id_provider) ';
    qry += where;
    qry += order_by;
    qry += limit;
    var qry_callback = connection.query(qry, parametros, function(err, results) {
      console.log(qry_callback.sql);
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }

      var cash_total = 0;
      var total_count = 0;
      var cash_result = [{ cash: {}, detail: [] }];
      if(results[3].length){
        total_count = results[3][0].total_count;
        cash_total = results[2][0];
      }

      var cash = results[4];
      var result = mysql_helper.getResult(cash, total_count, pagination);
      cash_result = [{ cash: cash_total, detail: result }];

      res.jsonp(cash_result);
    });
  });
};

exports.load_subaccount = function(req, res){
  var id_zone = req.body.id_zone;
  var id_subaccount = req.body.id_subaccount;
  var amount = req.body.amount;
  var observation = req.body.observation;

  var msg = 'TODO OK';
  var error = false;
  var qry = '';
  var qry_callback = '';
  var parametros = [];
  if(id_zone !== undefined && id_zone !== null &&
    id_subaccount !== undefined && id_subaccount !== null &&
    amount !== undefined && amount !== null && amount > 0){
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error al cargar el concepto.';
        error = true;
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      //Comienza la transaccion.
      connection.beginTransaction(function(err) {
        if (err) {
          msg = 'Error al cargar el concepto.';
          error = true;
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }
        var subaccount_insert = {
          id_subaccount: id_subaccount,
          id_zone: id_zone,
          amount: amount,
          id_user_created: req.user.id_user
        };
        qry = 'INSERT INTO subaccount_detail SET ?, subaccount_date = CURDATE(); ';
        qry_callback = connection.query(qry, [subaccount_insert], function(err, result) {
          console.log(qry_callback.sql);
          if (err) {
            msg = 'Error al cargar el pago.';
            error = true;
            return connection.rollback(function() {
              res.jsonp([{ error: error, msg: msg }]);
              return;
            });
          }

          var parametros = [];

          //Temporal de la caja, para obtener la ultima caja.
          qry = 'DROP TEMPORARY TABLE IF EXISTS tmp_cash;';
          qry += 'CREATE TEMPORARY TABLE tmp_cash ';
          qry += 'SELECT ';
          qry += ' MAX(id_cash) id_cash ';
          qry += 'FROM ';
          qry += '  cash ';
          qry += 'WHERE ';
          qry += '  cash.id_zone = ? ';
          qry += '  AND cash.id_status = ?; ';
          parametros.push(id_zone);
          parametros.push(globals.ACTIVO);

          // Agrego la relacion del detalle de la ultima subcuenta ingresada.
          qry += 'INSERT INTO cash_detail ';
          qry += '  (id_cash, id_subaccount_detail, id_user_created, observation) ';
          qry += 'SELECT ';
          qry += '  tc.id_cash, ';
          qry += '  ? id_subaccount_detail, ';
          qry += '  ? id_user_created, ';
          qry += '  ? observation ';
          qry += 'FROM ';
          qry += '  tmp_cash tc;';
          parametros.push(result.insertId);
          parametros.push(req.user.id_user);
          parametros.push(observation);
          qry_callback = connection.query(qry, parametros, function(err, result) {
            console.log(qry_callback.sql);
            if (err) {
              msg = 'Error al cargar el pago.';
              error = true;
              return connection.rollback(function() {
                res.jsonp([{ error: error, msg: msg }]);
                return;
              });
            }

            //COMMIT.
            connection.commit(function(err) {
              if (err) {
                msg = 'Error al cargar el pago.';
                error = true;
                return connection.rollback(function() {
                  res.jsonp([{ error: error, msg: msg }]);
                  return;
                });
              }
              res.jsonp([{ error: error, msg: msg }]);
            });
          });
        });
      });
    });
  } else{
    msg = 'Error en los parámetros.';
    error = true;
    res.jsonp([{ error: error, msg: msg }]);
    return;
  }
};

exports.load_start_cash_count = function(req, res){
  var id_zone = req.body.id_zone;
  var start_cash_count = req.body.start_cash_count;

  var msg = 'TODO OK';
  var error = false;
  var qry = '';
  var qry_callback = '';
  var parametros = [];
  if(id_zone !== undefined && id_zone !== null &&
    start_cash_count !== undefined && start_cash_count !== null && start_cash_count > 0){
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error al cargar el arqueo inicial.';
        error = true;
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      //Comienza la transaccion.
      connection.beginTransaction(function(err) {
        if (err) {
          msg = 'Error al cargar el arqueo inicial.';
          error = true;
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }

        var parametros = [];

        //Temporal de la caja, para obtener la ultima caja.
        qry = 'DROP TEMPORARY TABLE IF EXISTS tmp_cash;';
        qry += 'CREATE TEMPORARY TABLE tmp_cash ';
        qry += 'SELECT ';
        qry += ' MAX(id_cash) id_cash ';
        qry += 'FROM ';
        qry += '  cash ';
        qry += 'WHERE ';
        qry += '  cash.id_zone = ? ';
        qry += '  AND cash.id_status = ?; ';
        parametros.push(id_zone);
        parametros.push(globals.ACTIVO);

        // Agrego el monto del arqueo inicial.
        qry += 'UPDATE ';
        qry += '  cash ';
        qry += '  JOIN tmp_cash USING(id_cash) ';
        qry += 'SET ';
        qry += '  cash.start_cash_count = ?, ';
        qry += '  cash.id_user_modified = ?, ';
        qry += '  cash.modified = NOW() ';
        qry += ';';
        parametros.push(start_cash_count);
        parametros.push(req.user.id_user);
        qry_callback = connection.query(qry, parametros, function(err, result) {
          console.log(qry_callback.sql);
          if (err) {
            msg = 'Error al cargar el arqueo inicial.';
            error = true;
            return connection.rollback(function() {
              res.jsonp([{ error: error, msg: msg }]);
              return;
            });
          }

          //COMMIT.
          connection.commit(function(err) {
            if (err) {
              msg = 'Error al cargar el arqueo inicial.';
              error = true;
              return connection.rollback(function() {
                res.jsonp([{ error: error, msg: msg }]);
                return;
              });
            }
            res.jsonp([{ error: error, msg: msg }]);
          });
        });
      });
    });
  } else{
    msg = 'Error en los parámetros.';
    error = true;
    res.jsonp([{ error: error, msg: msg }]);
    return;
  }
};

exports.load_final_cash_count = function(req, res){
  var id_zone = req.body.id_zone;
  var final_cash_count = req.body.final_cash_count;

  var msg = 'TODO OK';
  var error = false;
  var qry = '';
  var qry_callback = '';
  var parametros = [];
  if(id_zone !== undefined && id_zone !== null &&
    final_cash_count !== undefined && final_cash_count !== null && final_cash_count > 0){
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error al cargar el arqueo final.';
        error = true;
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      //Comienza la transaccion.
      connection.beginTransaction(function(err) {
        if (err) {
          msg = 'Error al cargar el arqueo final.';
          error = true;
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }

        var parametros = [];

        //Temporal de la caja, para obtener la ultima caja.
        qry = 'DROP TEMPORARY TABLE IF EXISTS tmp_cash;';
        qry += 'CREATE TEMPORARY TABLE tmp_cash ';
        qry += 'SELECT ';
        qry += ' MAX(id_cash) id_cash ';
        qry += 'FROM ';
        qry += '  cash ';
        qry += 'WHERE ';
        qry += '  cash.id_zone = ? ';
        qry += '  AND cash.id_status = ?; ';
        parametros.push(id_zone);
        parametros.push(globals.ACTIVO);

        // Agrego el monto de arqueo final, coloco la caja en estado cerrado.
        qry += 'UPDATE ';
        qry += '  cash ';
        qry += '  JOIN tmp_cash USING(id_cash) ';
        qry += 'SET ';
        qry += '  cash.final_cash_count = ?, ';
        qry += '  cash.id_user_modified = ?, ';
        qry += '  cash.id_status = ?, ';
        qry += '  cash.modified = NOW() ';
        qry += ';';
        parametros.push(final_cash_count);
        parametros.push(req.user.id_user);
        parametros.push(globals.NO_ACTIVO);

        //Se crea una nueva caja.
        qry += 'INSERT INTO cash ';
        qry += '  (id_zone, cash_date, start_amount) ';
        qry += 'VALUES(?, CURDATE(), ?) ';
        qry += ';';
        parametros.push(id_zone);
        parametros.push(final_cash_count);
        qry_callback = connection.query(qry, parametros, function(err, result) {
          console.log(qry_callback.sql);
          if (err) {
            msg = 'Error al cargar el arqueo inicial.';
            error = true;
            return connection.rollback(function() {
              res.jsonp([{ error: error, msg: msg }]);
              return;
            });
          }

          //COMMIT.
          connection.commit(function(err) {
            if (err) {
              msg = 'Error al cargar el arqueo inicial.';
              error = true;
              return connection.rollback(function() {
                res.jsonp([{ error: error, msg: msg }]);
                return;
              });
            }
            res.jsonp([{ error: error, msg: msg }]);
          });
        });
      });
    });
  } else{
    msg = 'Error en los parámetros.';
    error = true;
    res.jsonp([{ error: error, msg: msg }]);
    return;
  }
};
