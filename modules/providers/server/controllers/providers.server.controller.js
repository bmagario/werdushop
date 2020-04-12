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
 * Create a Provider
 */
exports.create = function(req, res) {
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    connection.beginTransaction(function(err) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      var provider = {
        razon_social: req.body.razon_social,
        cuit: req.body.cuit,
        nombre_fantasia: req.body.nombre_fantasia,
        direccion: req.body.direccion,
        email: req.body.email,
        telefono: req.body.telefono,
        telefono_alternativo: req.body.telefono_alternativo,
        contacto: req.body.contacto,
        id_status: req.body.id_status,
        id_user_created: req.user.id_user
      };
      var qry = '';
      qry = 'INSERT INTO provider SET ?; ';
      connection.query(qry, provider, function(err, result) {
        if (err) {
          return connection.rollback(function() {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          });
        }
        provider.id_provider = result.insertId;
        var cta_cte = {
          id_provider: provider.id_provider,
          id_payment_method: globals.PAGOS.CTA_CORRIENTE,
          id_status: req.body.id_status,
          id_user_created: req.user.id_user
        };
        qry = 'INSERT INTO provider_payment SET ?, pp_date = CURDATE(); ';
        connection.query(qry, cta_cte, function(err, result) {
          if (err) {
            return connection.rollback(function() {
              return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
              });
            });
          }
          connection.commit(function(err) {
            if (err) {
              return connection.rollback(function() {
                return res.status(400).send({
                  message: errorHandler.getErrorMessage(err)
                });
              });
            }
            res.jsonp(provider);
          });
        });
      });
    });
  });
};

/**
 * Show the current Provider
 */
exports.read = function(req, res) {
  var provider = req.provider ? req.provider : {};
  res.jsonp(provider);
};

/**
 * Update a Provider
 */
exports.update = function(req, res) {
  var provider = req.provider;
  provider = _.extend(provider , req.body);
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    var provider_update = {
      razon_social: req.body.razon_social,
      cuit: req.body.cuit,
      nombre_fantasia: req.body.nombre_fantasia,
      direccion: req.body.direccion,
      email: req.body.email,
      telefono: req.body.telefono,
      telefono_alternativo: req.body.telefono_alternativo,
      contacto: req.body.contacto,
      id_status: req.body.id_status,
      id_user_modified: req.user.id_user
    };
    var qry = 'UPDATE provider SET ?, modified = NOW() WHERE id_provider = ?; ';
    var qry_callback = connection.query(qry, [provider_update, provider.id_provider], function(err, result) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.jsonp(provider);
    });
  });
};

/**
 * Delete an Provider
 */
exports.delete = function(req, res) {
  var provider = req.provider ;
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    var qry = 'UPDATE provider SET id_status = ?, id_user_modified = ?, modified = NOW() WHERE id_provider = ?; ';
    connection.query(qry, [globals.NO_ACTIVO, req.user.id_user, provider.id_provider], function(err, result) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      provider.id_status = globals.NO_ACTIVO;
      res.jsonp(provider);
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
    qry += '  p.*, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  provider p ';
    qry += '  JOIN status st USING(id_status) ';
    qry += 'ORDER BY p.nombre_fantasia;';
    connection.query(qry, [], function(err, providers) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.jsonp(providers);
    });
  });
};

/**
 * List of Providers
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
    var where = mysql_helper.getWhereFilterProvider(connection, req.query.filter);

    //ORDER BY.
    var order_by = mysql_helper.getOrderByProvider('nombre_fantasia', req.query.sorting);

    //LIMIT.
    var rtdo_limit_pag = mysql_helper.getLimitAndPagination(page, count);
    var pagination = rtdo_limit_pag.pagination;
    var limit = rtdo_limit_pag.limit;

    var qry = '';
    qry += 'SELECT ';
    qry += '  COUNT(*) total_count ';
    qry += 'FROM ';
    qry += '  provider p ';
    qry += '  JOIN status st USING(id_status) ';
    qry += where;
    qry += '; ';
    qry += 'SELECT ';
    qry += '  p.*, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  provider p ';
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
      var providers = results[1];
      var result = mysql_helper.getResult(providers, total_count, pagination);

      res.jsonp(result);
    });
  });
};

/**
 * Providers middleware
 */
exports.providerByID = function(req, res, next, id_provider) {
  req.getConnection(function(err, connection) {
    if (err) {
      return next(err);
    }
    var qry = '';
    qry += 'SELECT ';
    qry += '  p.*, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  provider p ';
    qry += '  JOIN status st USING(id_status) ';
    qry += 'WHERE ';
    qry += '  p.id_provider = ?; ';
    connection.query(qry, [id_provider], function(err, providers) {
      if (err) {
        return next(err);
      } else if (!providers.length) {
        return res.status(404).send({
          message: 'No se ha encontrado el proveedor.'
        });
      }
      req.provider = providers[0];
      next();
    });
  });
};

/********************************* PROVIDERS DEBTS ****************************/
/**
 * Show the current Provider Debt
 */
exports.read_debt = function(req, res) {
  var provider = req.provider ? req.provider : {};
  res.jsonp(provider);
};

/**
 * List of Providers Debts
 */
exports.list_providers_debts = function(req, res) {
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    var count = req.query.count || 5;
    var page = req.query.page || 1;

    //WHERE.
    var where = mysql_helper.getWhereFilterProvider(connection, req.query.filter);
    if(where === ''){
      where += 'WHERE pp.id_payment_method = ' + connection.escape(globals.PAGOS.CTA_CORRIENTE) + ' ';
    } else{
      where += '  AND pp.id_payment_method = ' + connection.escape(globals.PAGOS.CTA_CORRIENTE) + ' ';
    }

    //ORDER BY.
    var order_by = mysql_helper.getOrderByProvider('nombre_fantasia', req.query.sorting);

    //LIMIT.
    var rtdo_limit_pag = mysql_helper.getLimitAndPagination(page, count);
    var pagination = rtdo_limit_pag.pagination;
    var limit = rtdo_limit_pag.limit;

    var qry = '';
    qry += 'SELECT ';
    qry += '  COUNT(DISTINCT id_provider_payment) total_count ';
    qry += 'FROM ';
    qry += '  provider p ';
    qry += '  JOIN provider_payment pp USING(id_provider) ';
    qry += '  JOIN provider_payment_detail ppd USING(id_provider_payment) ';
    qry += where;
    qry += ' GROUP BY pp.id_provider_payment ';
    qry += 'HAVING SUM(ppd.amount * ppd.sign) > 0 ';
    qry += '; ';
    qry += 'SELECT ';
    qry += '  p.*, ';
    qry += '  pp.*, ';
    qry += '  SUM(ppd.amount * ppd.sign) total ';
    qry += 'FROM ';
    qry += '  provider p ';
    qry += '  JOIN provider_payment pp USING(id_provider) ';
    qry += '  JOIN provider_payment_detail ppd USING(id_provider_payment) ';
    qry += where;
    qry += ' GROUP BY pp.id_provider_payment ';
    qry += 'HAVING SUM(ppd.amount * ppd.sign) > 0 ';
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
      var providers = results[1];
      var result = mysql_helper.getResult(providers, total_count, pagination);

      res.jsonp(result);
    });
  });
};

/**
 * Providers middleware
 */
exports.providerDebtsByID = function(req, res, next, id_provider) {
  req.getConnection(function(err, connection) {
    if (err) {
      return next(err);
    }
    var qry_callback = '';
    var qry = '';
    qry += 'SELECT ';
    qry += '  p.*, ';
    qry += '  pp.*, ';
    qry += '  SUM(ppd.amount * ppd.sign) total ';
    qry += 'FROM ';
    qry += '  provider p ';
    qry += '  JOIN provider_payment pp USING(id_provider) ';
    qry += '  JOIN provider_payment_detail ppd USING(id_provider_payment) ';
    qry += 'WHERE ';
    qry += '  p.id_provider = ? ';
    qry += '  AND pp.id_payment_method = ?; ';
    qry_callback = connection.query(qry, [id_provider, globals.PAGOS.CTA_CORRIENTE], function(err, providers) {
      console.log(qry_callback.sql);
      if (err) {
        return next(err);
      } else if (!providers.length) {
        return res.status(404).send({
          message: 'No se ha encontrado el proveedor.'
        });
      }
      qry = 'SELECT ';
      qry += '  pp.*, ';
      qry += '  ppd.amount, ';
      qry += '  ppd.sign, ';
      qry += '  ppd.created, ';
      qry += '  IF(po.id_purchase_order IS NOT NULL, po.number, "--") purchase_number ';
      qry += 'FROM ';
      qry += '  provider p ';
      qry += '  JOIN provider_payment pp USING(id_provider) ';
      qry += '  JOIN provider_payment_detail ppd USING(id_provider_payment) ';
      qry += '  LEFT JOIN purchase_order po USING(id_purchase_order) ';
      qry += 'WHERE ';
      qry += '  p.id_provider = ? ';
      qry += '  AND pp.id_payment_method = ?; ';
      qry_callback = connection.query(qry, [id_provider, globals.PAGOS.CTA_CORRIENTE], function(err, debts) {
        console.log(qry_callback.sql);
        if (err) {
          return next(err);
        } else if (!providers.length) {
          return res.status(404).send({
            message: 'No se ha encontrado el proveedor.'
          });
        }
        req.provider = providers[0];
        req.provider.debts = debts;
        next();
      });
    });
  });
};

exports.load_payment = function(req, res){
  var id_zone = req.body.id_zone;
  var amount = req.body.amount;
  var id_provider_payment = req.body.id_provider_payment;
  var observation = req.body.observation;

  var msg = 'TODO OK';
  var error = false;
  var qry = '';
  var qry_callback = '';
  var parametros = [];
  if(id_zone !== undefined && id_zone !== null &&
    id_provider_payment !== undefined && id_provider_payment !== null &&
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
          id_provider_payment: id_provider_payment,
          amount: amount,
          sign: globals.PAGOS.RESTA,
          id_user_created: req.user.id_user
        };
        qry = 'INSERT INTO provider_payment_detail SET ?; ';
        parametros.push(payment_insert);

        //Se ingresan los pagos efectivos como el detalle de una subcuenta.
        qry += 'INSERT INTO subaccount_detail ';
        qry += '  (id_subaccount, id_zone, id_provider_payment, amount, subaccount_date, id_user_created) ';
        qry += 'SELECT ';
        qry += '  sacc.id_subaccount, ';
        qry += '  ? id_zone, ';
        qry += '  ? id_provider_payment, ';
        qry += '  ? amount, ';
        qry += '  CURDATE() subaccount_date, ';
        qry += '  ? id_user_created ';
        qry += 'FROM ';
        qry += '  subaccount sacc ';
        qry += 'WHERE ';
        qry += '  sacc.id_subaccount = ?; ';
        parametros.push(id_zone);
        parametros.push(id_provider_payment);
        parametros.push(amount);
        parametros.push(req.user.id_user);
        parametros.push(globals.SUBCUENTAS.COMPRAS_PAGADAS);
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
