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
 * Show the current User Debt
 */
exports.read_debt = function(req, res) {
  var usuario = req.usuario ? req.usuario : {};
  res.jsonp(usuario);
};

/**
 * List of Users Debts
 */
exports.list_users_debts = function(req, res) {
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    var count = req.query.count || 5;
    var page = req.query.page || 1;

    //WHERE.
    var where = mysql_helper.getWhereFilterUser(connection, req.query.filter);
    if(where === ''){
      where += 'WHERE up.id_payment_method = ' + connection.escape(globals.PAGOS.CTA_CORRIENTE) + ' ';
    } else{
      where += '  AND up.id_payment_method = ' + connection.escape(globals.PAGOS.CTA_CORRIENTE) + ' ';
    }

    //ORDER BY.
    var order_by = mysql_helper.getOrderByUser('user_name', req.query.sorting);

    //LIMIT.
    var rtdo_limit_pag = mysql_helper.getLimitAndPagination(page, count);
    var pagination = rtdo_limit_pag.pagination;
    var limit = rtdo_limit_pag.limit;

    var qry = '';
    qry += 'SELECT ';
    qry += '  COUNT(DISTINCT id_user_payment) total_count ';
    qry += 'FROM ';
    qry += '  user u ';
    qry += '  JOIN user_payment up USING(id_user) ';
    qry += '  JOIN user_payment_detail upd USING(id_user_payment) ';
    qry += where;
    qry += 'GROUP BY up.id_user_payment ';
    qry += 'HAVING SUM(upd.amount * upd.sign) > 0 ';
    qry += '; ';
    qry += 'SELECT ';
    qry += '  u.*, ';
    qry += '  CONCAT(u.first_name, " ", u.last_name) user_name, ';
    qry += '  up.*, ';
    qry += '  SUM(upd.amount * upd.sign) total ';
    qry += 'FROM ';
    qry += '  user u ';
    qry += '  JOIN user_payment up USING(id_user) ';
    qry += '  JOIN user_payment_detail upd USING(id_user_payment) ';
    qry += where;
    qry += 'GROUP BY up.id_user_payment ';
    qry += 'HAVING SUM(upd.amount * upd.sign) > 0 ';
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
      var users = results[1];
      var result = mysql_helper.getResult(users, total_count, pagination);

      res.jsonp(result);
    });
  });
};

/**
 * Users middleware
 */
exports.userDebtsByID = function(req, res, next, id_user) {
  req.getConnection(function(err, connection) {
    if (err) {
      return next(err);
    }
    var qry_callback = '';
    var qry = '';
    qry += 'SELECT ';
    qry += '  u.*, ';
    qry += '  CONCAT(u.first_name, " ", u.last_name) user_name, ';
    qry += '  up.*, ';
    qry += '  SUM(upd.amount * upd.sign) total ';
    qry += 'FROM ';
    qry += '  user u ';
    qry += '  JOIN user_payment up USING(id_user) ';
    qry += '  JOIN user_payment_detail upd USING(id_user_payment) ';
    qry += 'WHERE ';
    qry += '  u.id_user = ? ';
    qry += '  AND up.id_payment_method = ?; ';
    qry_callback = connection.query(qry, [id_user, globals.PAGOS.CTA_CORRIENTE], function(err, users) {
      console.log(qry_callback.sql);
      if (err) {
        return next(err);
      } else if (!users.length) {
        return res.status(404).send({
          message: 'No se ha encontrado el proveedor.'
        });
      }
      qry = 'SELECT ';
      qry += '  up.*, ';
      qry += '  upd.amount, ';
      qry += '  upd.sign, ';
      qry += '  upd.created, ';
      qry += '  IF(bo.id_basket_order IS NOT NULL, bo.id_basket_order, "--") id_basket_order, ';
      qry += '  IF(bo.id_basket_order IS NOT NULL, bo.number, "--") number ';
      qry += 'FROM ';
      qry += '  user u ';
      qry += '  JOIN user_payment up USING(id_user) ';
      qry += '  JOIN user_payment_detail upd USING(id_user_payment) ';
      qry += '  LEFT JOIN basket_order bo USING(id_basket_order) ';
      qry += 'WHERE ';
      qry += '  u.id_user = ? ';
      qry += '  AND up.id_payment_method = ?; ';
      qry_callback = connection.query(qry, [id_user, globals.PAGOS.CTA_CORRIENTE], function(err, debts) {
        console.log(qry_callback.sql);
        if (err) {
          return next(err);
        } else if (!users.length) {
          return res.status(404).send({
            message: 'No se ha encontrado el usuario.'
          });
        }
        req.usuario = users[0];
        req.usuario.debts = debts;
        next();
      });
    });
  });
};

exports.load_payment = function(req, res){
  var id_zone = req.body.id_zone;
  var amount = req.body.amount;
  var id_user_payment = req.body.id_user_payment;
  var observation = req.body.observation;

  var msg = 'TODO OK';
  var error = false;
  var qry = '';
  var qry_callback = '';
  var parametros = [];
  if(id_zone !== undefined && id_zone !== null &&
    id_user_payment !== undefined && id_user_payment !== null &&
    amount !== undefined && amount !== null && amount > 0){
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error al cargar el pago.';
        error = true;
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      //Comienza la transaccion.
      connection.beginTransaction(function(err) {
        if (err) {
          msg = 'Error al cargar el pago.';
          error = true;
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }
        var parametros = [];
        var payment_insert = {
          id_user_payment: id_user_payment,
          amount: amount,
          sign: globals.PAGOS.RESTA,
          id_user_created: req.user.id_user
        };
        qry = 'INSERT INTO user_payment_detail SET ?; ';
        parametros.push(payment_insert);

        //Se ingresan los pagos efectivos como el detalle de una subcuenta.
        qry += 'INSERT INTO subaccount_detail ';
        qry += '  (id_subaccount, id_zone, id_user_payment, amount, subaccount_date, id_user_created) ';
        qry += 'SELECT ';
        qry += '  sacc.id_subaccount, ';
        qry += '  ? id_zone, ';
        qry += '  ? id_user_payment, ';
        qry += '  ? amount, ';
        qry += '  CURDATE() subaccount_date, ';
        qry += '  ? id_user_created ';
        qry += 'FROM ';
        qry += '  subaccount sacc ';
        qry += 'WHERE ';
        qry += '  sacc.id_subaccount = ?; ';
        parametros.push(id_zone);
        parametros.push(id_user_payment);
        parametros.push(amount);
        parametros.push(req.user.id_user);
        parametros.push(globals.SUBCUENTAS.VENTAS_COBRADAS);
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

          parametros = [];

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
          qry += '  tmp_cash tc ;';
          parametros.push(result[1].insertId);
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
