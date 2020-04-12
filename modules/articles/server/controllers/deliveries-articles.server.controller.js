'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  async = require('async'),
  moment = require('moment'),
  globals = require(path.resolve('.','./config/globals')),
  mysql_helper = require(path.resolve('.','./config/mysql_helper')),
  multer = require('multer'),
  config = require(path.resolve('./config/config')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

/**
 * Show the current Delivery.
 */
exports.read = function(req, res) {
  var delivery_order = req.delivery_order ? req.delivery_order : {};
  res.jsonp(delivery_order);
};

exports.change_article = function(req, res){
  var id_basket_order = req.body.id_basket_order;
  var id_location = req.body.id_location;
  var article = req.body.article;
  var new_article = req.body.new_article;
  var id_article = article.id_article;
  var id_basket = article.id_basket;
  var id_article_new = new_article.id_article;

  var msg = 'TODO OK';
  var error = false;
  var qry = '';
  var qry_callback = '';
  if(id_basket_order !== undefined && id_basket_order !== null){
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error al cargar el presente en la orden de entrega.';
        error = true;
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      //Se verifica que se puedan agregar articulos.
      qry = 'SELECT bo.id_status, st.name status_name FROM basket_order bo JOIN status st USING(id_status) WHERE bo.id_basket_order = ?; ';
      qry_callback = connection.query(qry, [id_basket_order], function(err, orden) {
        console.log(qry_callback.sql);
        if (err) {
          msg = 'Error al cargar el presente en la orden de entrega.';
          error = true;
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }

        //Chequeo por existencia de orden de entrega.
        if(!orden.length){
          msg = 'Error al cargar el presente en la orden de entrega.';
          error = true;
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }

        //Chequeo por estado de orden de entrega.
        if(orden[0].id_status !== globals.CANASTA_PENDIENTE_ENTREGA){
          msg = 'La orden de entrega se encuentra en un estado en el cual no es posible realizar cambios (' + orden[0].status_name + ')';
          error = true;
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }

        //Price.
        qry = 'DROP TEMPORARY TABLE IF EXISTS tmp_price_date; ';
        qry += 'CREATE TEMPORARY TABLE tmp_price_date ';
        qry += 'SELECT ';
        qry += '  p.id_article, ';
        qry += '  MAX(p.created) created ';
        qry += 'FROM ';
        qry += '  price p ';
        qry += 'WHERE ';
        qry += '  p.id_location = ? ';
        qry += '  AND p.id_article = ? ';
        qry += 'GROUP BY p.id_article;';

        qry += 'SELECT ';
        qry += '  p.price ';
        qry += 'FROM ';
        qry += '  price p ';
        qry += '  JOIN tmp_price_date tpd ON(tpd.id_article = p.id_article AND tpd.created = p.created) ';
        qry += 'WHERE ';
        qry += '  p.id_location = ? ';
        qry += '  AND p.id_article = ?; ';
        qry_callback = connection.query(qry, [id_location, id_article_new, id_location, id_article_new], function(err, price) {
          console.log(qry_callback.sql);
          if (err) {
            msg = 'Error al cambiar el artículo en la orden de entrega.';
            error = true;
            res.jsonp([{ error: error, msg: msg }]);
            return;
          }

          if (!price[2].length || price[2][0].price === null || price[2][0].price === 0) {
            msg = 'No existe precio para el artículo que se quiere ingresar.';
            error = true;
            res.jsonp([{ error: error, msg: msg }]);
            return;
          }

          var basket = {
            id_basket_order: id_basket_order,
            id_article: id_article_new,
            price: price[2][0].price
          };

          //Comienza la transaccion.
          connection.beginTransaction(function(err) {
            if (err) {
              msg = 'Error al cargar el presente en la orden de entrega.';
              error = true;
              res.jsonp([{ error: error, msg: msg }]);
              return;
            }

            //Se actualiza el estado del articulo cambiado.
            qry = 'UPDATE basket SET id_status = ?, modified = NOW() WHERE id_basket = ?;';

            //Se inserta el articulo.
            qry += 'INSERT INTO basket SET ?;';
            qry_callback = connection.query(qry, [globals.ARTICULO_CAMBIADO, id_basket, basket], function(err, result) {
              console.log(qry_callback.sql);
              if (err) {
                msg = 'Error al cambiar el artículo en la orden de entrega.';
                error = true;
                return connection.rollback(function() {
                  res.jsonp([{ error: error, msg: msg }]);
                  return;
                });
              }

              //Se realiza el commit.
              connection.commit(function(err) {
                if (err) {
                  msg = 'Error al cargar el presente en la orden de entrega.';
                  error = true;
                  return connection.rollback(function() {
                    res.jsonp([{ error: error, msg: msg }]);
                    return;
                  });
                }

                //Actualizo el precio del scope de la vista.
                new_article.id_basket = result[1].insertId;
                console.log(new_article.id_basket);
                new_article.price = basket.price;
                new_article.status_basket = globals.ARTICULO_A_ENTREGAR;
                new_article.amount = 0;
                new_article.total = 0;

                //Se actualiza el estado del articulo cambiado.
                article.status_basket = globals.ARTICULO_CAMBIADO;
                res.jsonp([{ error: error, msg: msg, article: article, new_article: new_article }]);
              });

            });
          });
        });
      });
    });
  } else{
    msg = 'No existe Orden de Entrega.';
    error = true;
    res.jsonp([{ error: error, msg: msg }]);
    return;
  }
};

exports.add_gift = function(req, res){
  var id_basket_order = req.body.id_basket_order;
  var id_location = req.body.id_location;
  var article = req.body.article;
  var id_article = article.id_article;
  var gift = article.gift;

  var msg = 'TODO OK';
  var error = false;
  var qry = '';
  var qry_callback = '';
  if(id_basket_order !== undefined && id_basket_order !== null){
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error al cargar el presente en la orden de entrega.';
        error = true;
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      //Se verifica que se puedan agregar articulos.
      qry = 'SELECT bo.id_status, st.name status_name FROM basket_order bo JOIN status st USING(id_status) WHERE bo.id_basket_order = ?; ';
      qry_callback = connection.query(qry, [id_basket_order], function(err, orden) {
        console.log(qry_callback.sql);
        if (err) {
          msg = 'Error al cerrar la orden de entrega.';
          error = true;
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }

        //Chequeo por existencia de orden de entrega.
        if(!orden.length){
          msg = 'La orden de entrega no existe.';
          error = true;
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }

        //Chequeo por estado de orden de entrega.
        if(orden[0].id_status !== globals.CANASTA_PENDIENTE_ENTREGA){
          msg = 'La orden de entrega se encuentra en un estado en el cual no es posible realizar cambios (' + orden[0].status_name + ')';
          error = true;
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }

        var parametros = [];
        //Purchase Price.
        qry = 'DROP TEMPORARY TABLE IF EXISTS tmp_purchase_date; ';
        qry += 'CREATE TEMPORARY TABLE tmp_purchase_date ';
        qry += 'SELECT ';
        qry += '  p.id_article, ';
        qry += '  MAX(p.created) created ';
        qry += 'FROM ';
        qry += '  zone z ';
        qry += '  JOIN purchase_order po USING(id_zone) ';
        qry += '  JOIN purchase p USING(id_purchase_order) ';
        qry += 'WHERE ';
        qry += '  z.id_location = ? ';
        qry += '  AND p.id_article = ? ';
        qry += '  AND p.price > 0 ';
        qry += 'GROUP BY p.id_article; ';
        parametros.push(id_location);
        parametros.push(id_article);

        qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_purchase; ';
        qry += 'CREATE TEMPORARY TABLE tmp_purchase ';
        qry += 'SELECT ';
        qry += '  p.id_article, ';
        qry += '  p.price, ';
        qry += '  p.created ';
        qry += 'FROM ';
        qry += '  zone z ';
        qry += '  JOIN purchase_order po USING(id_zone) ';
        qry += '  JOIN purchase p USING(id_purchase_order) ';
        qry += '  JOIN tmp_purchase_date tpd ON(tpd.id_article = p.id_article AND tpd.created = p.created) ';
        qry += 'WHERE ';
        qry += '  z.id_location = ? ';
        qry += '  AND p.id_article = ?; ';
        parametros.push(id_location);
        parametros.push(id_article);

        //Survey Price.
        qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_survey_date; ';
        qry += 'CREATE TEMPORARY TABLE tmp_survey_date ';
        qry += 'SELECT ';
        qry += '  s.id_article, ';
        qry += '  MAX(s.created) created ';
        qry += 'FROM ';
        qry += '  survey_order so ';
        qry += '  JOIN survey s USING(id_survey_order) ';
        qry += 'WHERE ';
        qry += '  so.id_location = ? ';
        qry += '  AND s.id_article = ? ';
        qry += '  AND s.price > 0 ';
        qry += 'GROUP BY s.id_article;';
        parametros.push(id_location);
        parametros.push(id_article);

        qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_survey; ';
        qry += 'CREATE TEMPORARY TABLE tmp_survey ';
        qry += 'SELECT ';
        qry += '  s.id_article, ';
        qry += '  s.price, s.created ';
        qry += 'FROM ';
        qry += '  survey_order so ';
        qry += '  JOIN survey s USING(id_survey_order) ';
        qry += '  JOIN tmp_survey_date tsd ON(tsd.id_article = s.id_article AND tsd.created = s.created) ';
        qry += 'WHERE ';
        qry += '  so.id_location = ? ';
        qry += '  AND s.id_article = ?;';
        parametros.push(id_location);
        parametros.push(id_article);

        //Temporal de Precios de Compra/Relevamiento.
        qry += 'SELECT ';
        qry += '  a.id_article, ';
        qry += '  CASE ';
        qry += '    WHEN tpp.id_article IS NOT NULL AND ts.id_article IS NOT NULL THEN IF(tpp.created >= ts.created, tpp.price, ts.price) ';
        qry += '    WHEN tpp.id_article IS NOT NULL AND ts.id_article IS NULL THEN tpp.price ';
        qry += '    WHEN tpp.id_article IS NULL AND ts.id_article IS NOT NULL THEN ts.price ';
        qry += '    ELSE NULL ';
        qry += '  END price ';
        qry += 'FROM ';
        qry += '  article a ';
        qry += '  LEFT JOIN tmp_purchase tpp ON(a.id_article = tpp.id_article) ';
        qry += '  LEFT JOIN tmp_survey ts ON(a.id_article = ts.id_article) ';
        qry += 'WHERE ';
        qry += '  a.id_article = ?;';
        parametros.push(id_article);
        qry_callback = connection.query(qry, parametros, function(err, price) {
          console.log(qry_callback.sql);
          if (err) {
            msg = 'Error al insertar el presente en la orden de entrega.';
            error = true;
            res.jsonp([{ error: error, msg: msg }]);
            return;
          }

          if (!price[8].length || price[8][0].price === null || price[8][0].price === 0) {
            msg = 'No existe precio para el presente que se quiere ingresar.';
            error = true;
            res.jsonp([{ error: error, msg: msg }]);
            return;
          }

          var basket = {
            id_basket_order: id_basket_order,
            id_article: id_article,
            gift: gift,
            price: price[8][0].price
          };
          qry = 'INSERT INTO basket SET ?; ';
          qry_callback = connection.query(qry, [basket], function(err, result) {
            console.log(qry_callback.sql);
            if (err) {
              msg = 'Error al insertar el presente en la orden de entrega.';
              error = true;
              res.jsonp([{ error: error, msg: msg }]);
              return;
            }

            //Actualizo el precio del scope de la vista.
            article.id_basket = result.insertId;
            article.price = basket.price;
            article.status_basket = globals.ARTICULO_A_ENTREGAR;
            article.amount = 0;
            article.total = 0;
            res.jsonp([{ error: error, msg: msg, article: article }]);
          });
        });
      });
    });
  } else{
    msg = 'No existe Orden de Entrega.';
    error = true;
    res.jsonp([{ error: error, msg: msg }]);
    return;
  }
};

exports.update_article = function(req, res){
  var id_basket_order = req.body.id_basket_order;
  var id_location = req.body.id_location;
  var article = req.body.article;
  var id_article = article.id_article;
  var id_basket = article.id_basket;
  var amount = article.amount;

  var msg = 'TODO OK';
  var error = false;
  var qry = '';
  var qry_callback = '';
  if(id_basket_order !== undefined && id_basket_order !== null){
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error al actualizar el presente en la orden de entrega.';
        error = true;
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      //Se verifica que se puedan agregar articulos.
      qry = 'SELECT bo.id_status, st.name status_name FROM basket_order bo JOIN status st USING(id_status) WHERE bo.id_basket_order = ?; ';
      qry_callback = connection.query(qry, [id_basket_order], function(err, orden) {
        console.log(qry_callback.sql);
        if (err) {
          msg = 'Error al cerrar la orden de entrega.';
          error = true;
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }

        //Chequeo por existencia de orden de entrega.
        if(!orden.length){
          msg = 'La orden de entrega no existe.';
          error = true;
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }

        //Chequeo por estado de orden de entrega.
        if(orden[0].id_status !== globals.CANASTA_PENDIENTE_ENTREGA){
          msg = 'La orden de entrega se encuentra en un estado en el cual no es posible realizar cambios (' + orden[0].status_name + ')';
          error = true;
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }

        qry = 'UPDATE basket SET amount = ?, modified = NOW() WHERE id_basket = ?; ';
        qry_callback = connection.query(qry, [amount, id_basket], function(err, result) {
          console.log(qry_callback.sql);
          if (err) {
            msg = 'Error al actualizar el presente en la orden de entrega.';
            error = true;
            res.jsonp([{ error: error, msg: msg }]);
            return;
          }
          res.jsonp([{ error: error, msg: msg }]);
        });
      });
    });
  } else{
    msg = 'No existe Orden de Entrega.';
    error = true;
    res.jsonp([{ error: error, msg: msg }]);
    return;
  }
};

exports.remove_article = function(req, res){
  var id_basket_order = req.body.id_basket_order;
  var article = req.body.article;
  var id_article = article.id_article;
  var id_basket = article.id_basket;

  var msg = 'TODO OK';
  var error = false;
  var qry = '';
  var qry_callback = '';
  if(id_basket_order !== undefined && id_basket_order !== null){
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error al eliminar el presente en la orden de entrega.';
        error = true;
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      //Se verifica que se puedan agregar articulos.
      qry = 'SELECT bo.id_status, st.name status_name FROM basket_order bo JOIN status st USING(id_status) WHERE bo.id_basket_order = ?; ';
      qry_callback = connection.query(qry, [id_basket_order], function(err, orden) {
        console.log(qry_callback.sql);
        if (err) {
          msg = 'Error al cerrar la orden de entrega.';
          error = true;
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }

        //Chequeo por existencia de orden de entrega.
        if(!orden.length){
          msg = 'La orden de entrega no existe.';
          error = true;
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }

        //Chequeo por estado de orden de entrega.
        if(orden[0].id_status !== globals.CANASTA_PENDIENTE_ENTREGA){
          msg = 'La orden de entrega se encuentra en un estado en el cual no es posible realizar cambios (' + orden[0].status_name + ')';
          error = true;
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }

        qry = 'DELETE FROM basket WHERE id_basket = ? AND gift = 1;';
        qry_callback = connection.query(qry, [id_basket], function(err, result) {
          console.log(qry_callback.sql);
          if (err) {
            msg = 'Error al eliminar el presente en la orden de entrega.';
            error = true;
            res.jsonp([{ error: error, msg: msg }]);
            return;
          }
          res.jsonp([{ error: error, msg: msg }]);
        });
      });
    });
  } else{
    msg = 'No existe la Orden de Entrega.';
    error = true;
    res.jsonp([{ error: error, msg: msg }]);
    return;
  }
};

/**
 * List of Deliveries
 */
exports.list_deliveries = function(req, res) {
  if(req.query.id_zone === undefined || req.query.id_zone === null ||
    req.query.date_basket === undefined || req.query.date_basket === null ||
    req.query.delivery_hour === undefined || req.query.delivery_hour === null){
    return res.status(400).send({
      message: 'Debe ingresar la zona.'
    });
  }
  var id_zone = req.query.id_zone;
  var date_basket = req.query.date_basket;
  var delivery_hour = req.query.delivery_hour;
  var qry = '';
  var qry_callback;
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
    if(where !== ''){
      where += 'AND bo.id_zone = ' + connection.escape(id_zone) + ' ';
      where += 'AND bo.date_basket = ' + connection.escape(moment(date_basket).format('YYYY-MM-DD')) + ' ';
      where += 'AND bo.hour = ' + connection.escape(delivery_hour) + ' ';
      where += 'AND bo.id_status = ' + connection.escape(globals.CANASTA_PENDIENTE_ENTREGA) + ' ';
    } else{
      where += 'WHERE ';
      where += '  bo.id_zone = ' + connection.escape(id_zone) + ' ';
      where += '  AND bo.date_basket = ' + connection.escape(moment(date_basket).format('YYYY-MM-DD')) + ' ';
      where += '  AND bo.hour = ' + connection.escape(delivery_hour) + ' ';
      where += '  AND bo.id_status = ' + connection.escape(globals.CANASTA_PENDIENTE_ENTREGA) + ' ';
    }

    //ORDER BY.
    var order_by = mysql_helper.getOrderBy('bo.created', req.query.sorting);

    //LIMIT.
    var rtdo_limit_pag = mysql_helper.getLimitAndPagination(page, count);
    var pagination = rtdo_limit_pag.pagination;
    var limit = rtdo_limit_pag.limit;

    var qry = '';
    qry += 'SELECT ';
    qry += '  COUNT(*) total_count ';
    qry += 'FROM ';
    qry += '  basket_order bo ';
    qry += '  JOIN status st USING(id_status) ';
    qry += '  JOIN user u USING(id_user) ';
    qry += where;
    qry += ';';
    qry += 'SELECT ';
    qry += '  bo.*, ';
    qry += '  st.name status_name, ';
    qry += '  u.display_name, ';
    qry += '  CONCAT(u.first_name, " ", u.last_name) user_name ';
    qry += 'FROM ';
    qry += '  basket_order bo ';
    qry += '  JOIN status st USING(id_status) ';
    qry += '  JOIN user u USING(id_user) ';
    qry += where;
    qry += order_by;
    qry += limit;
    qry_callback = connection.query(qry, [], function(err, results) {
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
      var deliveries = results[1];
      var result = mysql_helper.getResult(deliveries, total_count, pagination);

      res.jsonp(result);
    });
  });
};

/**
 * Finish delivery order.
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.close_delivery_order = function(req, res){
  var id_basket_order = req.body.id_basket_order;
  var id_location = req.body.id_location;
  var id_zone = req.body.id_zone;
  var articles = req.body.articles;
  var complex_articles = req.body.complex_articles;
  var payment_methods = req.body.payment_methods;
  var code = globals.OK;


  if(id_basket_order === undefined || id_basket_order === null){
    res.jsonp([{ error: true, msg: '[Parámetros] - Error al cerrar la orden de entrega.' }]);
    return;
  }
  req.getConnection(function(err, connection) {
    if (err) {
      res.jsonp([{ error: true, msg: '[Connection] - Error al cerrar la orden de entrega.' }]);
      return;
    }

    //BEGIN.
    connection.beginTransaction(function(err) {
      if (err) {
        res.jsonp([{ error: true, msg: '[BTransaction] - Error al cerrar la orden de entrega.' }]);
        return;
      }

      //Config inicial de los datos.
      var data = {};
      data.msg = 'TODO OK';
      data.id_user_created = req.user.id_user;
      data.id_basket_order = id_basket_order;
      data.id_location = id_location;
      data.id_zone = id_zone;
      data.articles = articles;
      data.complex_articles = complex_articles;
      data.payment_methods = payment_methods;
      data.id_user_payment = null;
      data.id_user_client = null;
      data.code = code;
      data.total_oe = 0;
      data.articulos_sin_stock = [];

      //Inicia proceso de cierre en cascada.
      async.waterfall([
        _getDeliveryOrder(connection, data),
        _paso2CloseDeliveryOrder,
        _paso3CloseDeliveryOrder,
        _paso4CloseDeliveryOrder,
        _paso6CloseDeliveryOrder,
        _paso7CloseDeliveryOrder,
        _paso8CloseDeliveryOrder,
        _paso9CloseDeliveryOrder,
        _paso10CloseDeliveryOrder
      ], function (err, data) {
        if(err){
          return connection.rollback(function() {
            res.jsonp([{ error: true, msg: data.msg, code: data.code, articulos: data.articulos_sin_stock }]);
            return;
          });
        }

        //COMMIT.
        connection.commit(function(err) {
          if (err) {
            return connection.rollback(function() {
              res.jsonp([{ error: true, msg: '[CTransaction] - Error al cerrar la orden de entrega.' }]);
              return;
            });
          }
          res.jsonp([{ error: false, msg: data.msg }]);
        });
      });//END WATERFALL.
    });
  });
};

//******************************************************************************
// PASO 2.
//  2.1 Chequeo de estado de la orden de entrega (canasta).
//  2.2. Se obtiene la cuenta corriente del usuario si es que tiene.
//  2.3. Chequeo si tiene cuenta corriente.
//******************************************************************************
function _paso2CloseDeliveryOrder(connection, data, callback){
  //****************************************************************************
  // PASO 2.1. Chequeo por estado de orden de entrega.
  //****************************************************************************
  if(data.delivery_order.id_status !== globals.CANASTA_PENDIENTE_ENTREGA){
    data.msg = '[PASO 2] - La orden de entrega se encuentra en un estado en el cual no es posible cerrarla (' + data.delivery_order.status_name + ')';
    return callback(new Error(data.msg), data);
  }

  //Usuario de la orden de entrega.
  data.id_user_client = data.delivery_order.id_user;

  //****************************************************************************
  // PASO 2.2. Se obtiene la cuenta corriente del usuario si es que tiene.
  //****************************************************************************
  var qry = '';
  var qry_callback = '';
  var parametros = [];
  qry = 'SELECT * FROM user_payment WHERE id_user = ? AND id_payment_method = ?; ';
  parametros.push(data.id_user_client);
  parametros.push(globals.PAGOS.CTA_CORRIENTE);
  qry_callback = connection.query(qry, parametros, function(err, user_payments) {
    console.log(qry_callback.sql);
    if (err) {
      data.msg = '[PASO 2] - Error al cerrar la orden de entrega.';
      return callback(err, data);
    }

    //**************************************************************************
    // PASO 2.3. Chequeo si tiene cuenta corriente.
    //**************************************************************************
    try{
      if(user_payments.length){
        data.id_user_payment = user_payments[0].id_user_payment;
      }
    } catch(err){
      data.msg = '[PASO 2] - Error al cerrar la orden de entrega. (user_payment)';
      return callback(err, data);
    }

    callback(null, connection, data);
  });
}

//******************************************************************************
// PASO 3: [QUERIES]
//  3.1. Temporal de las cantidades de los articulos simples.
//  3.2. Temporal de las cantidades de los articulos complejos.
//  3.3. Agrego las cantidades de los articulos complejos a la tmp_basket_order.
//  3.4. Obtengo la temporal de las fechas del stock.
//  3.5. Obtengo los articulos que estan en stock.
//******************************************************************************
function _paso3CloseDeliveryOrder(connection, data, callback){
  var qry = '';
  var qry_callback = '';
  var parametros = [];

  //****************************************************************************
  // PASO 3.1. Temporal de las cantidades de los articulos simples.
  //****************************************************************************
  qry = 'DROP TEMPORARY TABLE IF EXISTS tmp_basket_order; ';
  qry += 'CREATE TEMPORARY TABLE tmp_basket_order ( ';
  qry += '  id_article INT, ';
  qry += '  total_delivery_order DECIMAL(10,3), ';
  qry += '  total_gift DECIMAL(10,3), ';
  qry += '  price DECIMAL(10,3), ';
  qry += '  PRIMARY KEY (id_article) ';
  qry += ') ';
  if(data.articles.length){
    qry += 'SELECT ';
    qry += '  a.id_article, ';
    qry += '  IF(b.gift = 0, b.amount * a.equivalence, 0) total_delivery_order, ';
    qry += '  IF(b.gift = 1, b.amount * a.equivalence, 0) total_gift, ';
    qry += '  b.price ';
    qry += 'FROM ';
    qry += '  basket b ';
    qry += '  JOIN article a USING(id_article) ';
    qry += 'WHERE ';
    qry += '  b.id_basket_order = ? ';
    qry += '  AND b.id_article IN (?) ';
    qry += '  AND b.id_status = ? ';
    parametros.push(data.id_basket_order);
    parametros.push(data.articles);
    parametros.push(globals.ARTICULO_A_ENTREGAR);
  }
  qry += ';';

  //****************************************************************************
  // PASO 3.2. Temporal de las cantidades de los articulos complejos.
  //****************************************************************************
  if(data.complex_articles.length){
    qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_basket_order_complex; ';
    qry += 'CREATE TEMPORARY TABLE tmp_basket_order_complex ';
    qry += 'SELECT ';
    qry += '  ca.id_article, ';
    qry += '  SUM(b.amount * ca.equivalence_complex) total_delivery_order ';
    qry += 'FROM ';
    qry += '  basket b ';
    qry += '  JOIN complex_article_detail ca USING(id_complex_article) ';
    qry += 'WHERE ';
    qry += '  b.id_basket_order = ? ';
    qry += '  AND b.id_complex_article IN (?) ';
    qry += 'GROUP BY ca.id_article; ';
    parametros.push(data.id_basket_order);
    parametros.push(data.complex_articles);

    //**************************************************************************
    // PASO 3.3. Agrego las cantidades de los articulos complejos a la tmp_basket_order.
    //**************************************************************************
    qry += 'INSERT INTO tmp_basket_order ';
    qry += 'SELECT ';
    qry += '  tboc.id_article, ';
    qry += '  tboc.total_delivery_order, ';
    qry += '  0 total_gift, ';
    qry += '  0 price ';
    qry += 'FROM ';
    qry += '  tmp_basket_order_complex tboc ';
    qry += 'ON DUPLICATE KEY UPDATE ';
    qry += '  total_delivery_order = tmp_basket_order.total_delivery_order + tboc.total_delivery_order ';
    qry += ';';
  }

  //****************************************************************************
  // PASO 3.4. Obtengo la temporal de las fechas del stock.
  //****************************************************************************
  qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_stock_date; ';
  qry += 'CREATE TEMPORARY TABLE tmp_stock_date ';
  qry += 'SELECT ';
  qry += '  st.id_article, ';
  qry += '  MAX(st.stock_date) stock_date ';
  qry += 'FROM ';
  qry += '  stock st ';
  qry += '  JOIN tmp_basket_order tbo USING(id_article) ';
  qry += 'WHERE ';
  qry += '  st.id_zone = ? ';
  qry += 'GROUP BY st.id_article;';
  parametros.push(data.id_zone);

  //****************************************************************************
  // PASO 3.5. Obtengo los articulos que estan en stock.
  //****************************************************************************
  qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_stock; ';
  qry += 'CREATE TEMPORARY TABLE tmp_stock ';
  qry += 'SELECT ';
  qry += '  ? id_zone, ';
  qry += '  tbo.id_article, ';
  qry += '  CURDATE() stock_date, ';
  qry += '  IF(st.id_article IS NOT NULL, st.total, 0) total_current, ';
  qry += '  tbo.total_delivery_order total_delivery, ';
  qry += '  tbo.total_gift total_gift_order, ';
  qry += '  IF(st.id_article IS NOT NULL, st.total - tbo.total_delivery_order - tbo.total_gift, -tbo.total_delivery_order - tbo.total_gift) total, ';
  qry += '  IF(st.id_article IS NOT NULL, st.total_delivery_order + tbo.total_delivery_order, tbo.total_delivery_order) total_delivery_order, ';
  qry += '  IF(st.id_article IS NOT NULL, st.total_gift + tbo.total_gift, tbo.total_gift) total_gift, ';
  qry += '  IF(st.id_article IS NOT NULL, st.price, 0) price ';
  qry += 'FROM ';
  qry += '  tmp_basket_order tbo ';
  qry += '  LEFT JOIN tmp_stock_date tstd ON(tstd.id_article = tbo.id_article) ';
  qry += '  LEFT JOIN stock st ON(st.id_zone = ? AND tstd.id_article = st.id_article AND tstd.stock_date = st.stock_date AND st.total > 0) ';
  qry += '; ';
  parametros.push(data.id_zone);
  parametros.push(data.id_zone);
  qry_callback = connection.query(qry, parametros, function(err, results) {
    console.log(qry_callback.sql);
    if (err) {
      data.msg = '[PASO 3] - Error al cerrar la orden de entrega.';
      return callback(err, data);
    }

    callback(null, connection, data);
  });
}

//******************************************************************************
// PASO 4: [QUERIES]
//  4.1. Se seleccionan los articulos sin stock.
//  4.2. Chequeo de articulos sin stock. En caso de que haya articulos sin stock,
//       no se puede cerrar la orden de entrega.
//******************************************************************************
function _paso4CloseDeliveryOrder(connection, data, callback){
  var qry = '';
  var qry_callback = '';
  var parametros = [];

  //****************************************************************************
  // PASO 4.1. Se seleccionan los articulos sin stock.
  //****************************************************************************
  qry = 'SELECT ';
  qry += '  a.*, ';
  qry += '  mu.name measurement_unit_name, ';
  qry += '  mu.abbreviation measurement_unit_abbreviation, ';
  qry += '  mu.abbreviation_plural measurement_unit_abbreviation_plural, ';
  qry += '  mue.name measurement_unit_equivalence_name, ';
  qry += '  mue.abbreviation measurement_unit_equivalence_abbreviation, ';
  qry += '  mue.abbreviation_plural measurement_unit_equivalence_abbreviation_plural, ';
  qry += '  sg.name subgroup_name, ';
  qry += '  CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0), "", LPAD(a.code, 3, 0)) full_code, ';
  qry += '  b.name brand_name, ';
  qry += '  ts.total ';
  qry += 'FROM ';
  qry += '  article a ';
  qry += '  JOIN measurement_unit mu USING(id_measurement_unit) ';
  qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
  qry += '  JOIN subgroup sg USING(id_subgroup) ';
  qry += '  JOIN grupo g USING(id_group) ';
  qry += '  JOIN tmp_stock ts USING(id_article) ';
  qry += '  LEFT JOIN brand b USING(id_brand) ';
  qry += 'WHERE ';
  qry += '  ts.total < 0 ';
  qry += ';';
  qry_callback = connection.query(qry, parametros, function(err, articulos) {
    console.log(qry_callback.sql);
    if (err) {
      data.msg = '[PASO 4] - Error al cerrar la orden de entrega.';
      return callback(err, data);
    }

    //**************************************************************************
    // PASO 4.2. Chequeo de artículos sin stock. En caso de que haya
    // articulos sin stock, no se puede cerrar la orden de entrega.
    //**************************************************************************
    try{
      if(articulos.length){
        data.msg = '[PASO 4] - Error al cerrar la orden de entrega. Artículos sin stock suficiente.';
        data.articulos_sin_stock = articulos;
        data.code = globals.WARNING_ARTICULOS_SIN_STOCK;
        return callback(new Error(data.msg), data);
      }
    } catch(err){
      data.msg = '[PASO 4] - Error al cerrar la orden de entrega. (articulos)';
      return callback(err, data);
    }

    callback(null, connection, data);
  });
}

//******************************************************************************
// PASO 6: [QUERIES]
//  6.1. SUBCUENTA STOCK: Actualizar los datos del stock.
//  6.2. Actualizar el estado de la cabecera de la canasta.
//  6.3. Actualizar el estado de los detalles de la canasta.
//  6.4. SUBCUENTA VENTAS ONLINE
//  6.5. SUBCUENTA COSTO DIRECTO DE VENTAS ONLINE
//  6.6. Inserto la cuenta corriente del usuario en caso de que no tenga.
//  6.7. Chequeo si tiene cuenta corriente.
//******************************************************************************
function _paso6CloseDeliveryOrder(connection, data, callback){
  var qry = '';
  var qry_callback = '';
  var parametros = [];

  //****************************************************************************
  // PASO 6.1: SUBCUENTA STOCK: Actualizar los datos del stock.
  //****************************************************************************
  qry = 'INSERT INTO stock ';
  qry += '  (id_zone, id_article, stock_date, total, total_delivery_order, total_gift, price) ';
  qry += 'SELECT ';
  qry += '  st.id_zone, ';
  qry += '  st.id_article, ';
  qry += '  st.stock_date, ';
  qry += '  st.total, ';
  qry += '  st.total_delivery_order, ';
  qry += '  st.total_gift, ';
  qry += '  st.price ';
  qry += 'FROM ';
  qry += '  tmp_stock st ';
  qry += 'ON DUPLICATE KEY UPDATE ';
  qry += '  total = st.total, ';
  qry += '  total_delivery_order = st.total_delivery_order, ';
  qry += '  total_gift = st.total_gift;';

  //****************************************************************************
  // PASO 6.2: Actualizar el estado de la cabecera de la canasta.
  //****************************************************************************
  qry += 'UPDATE basket_order SET id_status = ?, modified = NOW() WHERE id_basket_order = ?; ';
  parametros.push(globals.CANASTA_ENTREGADA);
  parametros.push(data.id_basket_order);

  //****************************************************************************
  // PASO 6.3: Actualizar el estado de los detalles de la canasta.
  //****************************************************************************
  qry += 'UPDATE ';
  qry += '  basket ';
  qry += 'SET ';
  qry += '  id_status = ?, ';
  qry += '  modified = NOW() ';
  qry += 'WHERE ';
  qry += '  id_basket_order = ? ';
  parametros.push(globals.ARTICULO_ENTREGADO);
  parametros.push(data.id_basket_order);
  if(data.articles.length && data.complex_articles.length){
    qry += '  AND (id_article IN (?) OR id_complex_article IN (?)) ';
    parametros.push(data.articles);
    parametros.push(data.complex_articles);
  } else if(data.articles.length){
    qry += '  AND id_article IN (?) ';
    parametros.push(data.articles);
  } else if(data.complex_articles.length){
    qry += '  AND id_complex_article IN (?) ';
    parametros.push(data.complex_articles);
  }
  qry += ';';

  //****************************************************************************
  // PASO 6.4: SUBCUENTA VENTAS_ONLINE
  //****************************************************************************
  qry += 'INSERT INTO subaccount_detail ';
  qry += '  (id_subaccount, id_zone, id_basket_order, amount, subaccount_date, id_user_created) ';
  qry += 'SELECT ';
  qry += '  sacc.id_subaccount, ';
  qry += '  ? id_zone, ';
  qry += '  b.id_basket_order, ';
  qry += '  SUM(b.price * b.amount) amount, ';
  qry += '  CURDATE() subaccount_date, ';
  qry += '  ? id_user_created ';
  qry += 'FROM ';
  qry += '  basket b ';
  qry += '  JOIN subaccount sacc ON(id_subaccount = ?) ';
  qry += 'WHERE ';
  qry += '  b.id_basket_order = ? ';
  qry += '  AND b.gift = 0 ';
  qry += '  AND b.id_status = ?; ';
  parametros.push(data.id_zone);
  parametros.push(data.id_user_created);
  parametros.push(globals.SUBCUENTAS.VENTAS_ONLINE);
  parametros.push(data.id_basket_order);
  parametros.push(globals.ARTICULO_ENTREGADO);

  //****************************************************************************
  // PASO 6.5: SUBCUENTA COSTO DIRECTO VENTAS ONLINE
  // Saco los valores de la temporal del stock que se va a quitar.
  //****************************************************************************
  qry += 'INSERT INTO subaccount_detail ';
  qry += '  (id_subaccount, id_zone, id_basket_order, amount, subaccount_date, id_user_created) ';
  qry += 'SELECT ';
  qry += '  sacc.id_subaccount, ';
  qry += '  ? id_zone, ';
  qry += '  ? id_basket_order, ';
  qry += '  SUM(st.price * (st.total_delivery + st.total_gift)) amount, ';
  qry += '  CURDATE() subaccount_date, ';
  qry += '  ? id_user_created ';
  qry += 'FROM ';
  qry += '  tmp_stock st ';
  qry += '  JOIN subaccount sacc ON(id_subaccount = ?); ';
  parametros.push(data.id_zone);
  parametros.push(data.id_basket_order);
  parametros.push(data.id_user_created);
  parametros.push(globals.SUBCUENTAS.COSTO_VENTAS_ONLINE);

  //****************************************************************************
  // PASO 6.6: SUBCUENTA PRESENTES
  // Saco los valores de la temporal del stock que se va a quitar.
  //****************************************************************************
  qry += 'INSERT INTO subaccount_detail ';
  qry += '  (id_subaccount, id_zone, id_basket_order, amount, subaccount_date, id_user_created) ';
  qry += 'SELECT ';
  qry += '  sacc.id_subaccount, ';
  qry += '  ? id_zone, ';
  qry += '  ? id_basket_order, ';
  qry += '  SUM(st.price * st.total_gift) amount, ';
  qry += '  CURDATE() subaccount_date, ';
  qry += '  ? id_user_created ';
  qry += 'FROM ';
  qry += '  tmp_stock st ';
  qry += '  JOIN subaccount sacc ON(id_subaccount = ?); ';
  parametros.push(data.id_zone);
  parametros.push(data.id_basket_order);
  parametros.push(data.id_user_created);
  parametros.push(globals.SUBCUENTAS.PRESENTES);

  //****************************************************************************
  // PASO 6.7: Inserto la cuenta corriente del usuario en caso de que no tenga.
  //****************************************************************************
  if(data.id_user_payment === null){
    qry += 'INSERT IGNORE INTO user_payment ';
    qry += '  (id_user, id_payment_method, up_date, id_user_created) ';
    qry += 'VALUES ';
    qry += ' (?, ?, CURDATE(), ?); ';
    parametros.push(data.id_user_client);
    parametros.push(globals.PAGOS.CTA_CORRIENTE);
    parametros.push(data.id_user_created);
  }
  qry_callback = connection.query(qry, parametros, function(err, results) {
    console.log(qry_callback.sql);
    if (err) {
      data.msg = '[PASO 6] - Error al cerrar la orden de entrega.';
      return callback(err, data);
    }

    //**************************************************************************
    // PASO 6.8: Chequeo si tiene cuenta corriente.
    //**************************************************************************
    try{
      if(data.id_user_payment === null){
        data.id_user_payment = results[6].insertId;
      }
    } catch(err){
      data.msg = '[PASO 6] - Error al cerrar la orden de entrega. (user_payment)';
      return callback(err, data);
    }

    callback(null, connection, data);
  });
}

//******************************************************************************
// PASO 7:
//  7.1. Selecciono el valor total de la orden de entrega.
//  7.2. Se obtiene el total valorizado de la orden de entrega.
//******************************************************************************
function _paso7CloseDeliveryOrder(connection, data, callback){
  var qry = '';
  var qry_callback = '';
  var parametros = [];

  //******************************************************************************
  // PASO 7.1: Selecciono el valor total de la orden de entrega.
  //******************************************************************************
  qry += 'SELECT ';
  qry += '  SUM(b.price * b.amount) amount ';
  qry += 'FROM ';
  qry += '  basket b ';
  qry += 'WHERE ';
  qry += '  b.id_basket_order = ? ';
  qry += '  AND b.gift = 0 ';
  qry += '  AND b.id_status = ?; ';
  parametros.push(data.id_basket_order);
  parametros.push(globals.ARTICULO_ENTREGADO);
  qry_callback = connection.query(qry, parametros, function(err, total_oe) {
    console.log(qry_callback.sql);
    if (err) {
      data.msg = '[PASO 7] - Error al cerrar la orden de entrega.';
      callback(err, data);
    }

    //******************************************************************************
    // PASO 7.2: Se obtiene el total valorizado de la orden de entrega.
    //******************************************************************************
    try{
      data.total_oe = total_oe[0].amount;
    } catch(err){
      data.msg = '[PASO 7] - Error al cerrar la orden de entrega. (total_oe)';
      callback(err, data);
    }

    callback(null, connection, data);
  });
}

//******************************************************************************
// PASO 8:
//  8.1. Chequeo si tiene cuenta corriente.
//  8.2: Chequear los medios de pago.
//******************************************************************************
function _paso8CloseDeliveryOrder(connection, data, callback){
  var qry = '';
  var qry_callback = '';
  var parametros = [];

  //******************************************************************************
  // PASO 8.1: Chequear los medios de pago.
  //******************************************************************************
  var basket_order_payment_array_insert = [];
  var debt_array_insert = [];
  var total_valued = 0;
  async.eachSeries(data.payment_methods, function(payment_method, callback) {
    //Solo si se envio un metodo de pago correcto.
    if(payment_method.total > 0){
      total_valued += payment_method.total;
      var payment_method_array = [
        payment_method.method.id_payment_method,
        data.id_basket_order,
        payment_method.total,
        data.id_user_created
      ];
      basket_order_payment_array_insert.push(payment_method_array);
    }
    callback();
  }, function(err) {
    if (err) {
      data.msg = '[PASO 8] - Error al cerrar la orden de entrega.';
      callback(err, data);
    }

    //******************************************************************************
    // PASO 8.2: Se chequea que el total ingresado sea el mismo que el valorizado.
    //******************************************************************************
    try{
      if(data.total_oe !== total_valued){
        data.msg = '[PASO 8] - Error al cerrar la orden de entrega. No se completa el pago del total.';
        callback(new Error(data.msg), data);
      }

      data.basket_order_payment_array_insert = basket_order_payment_array_insert;
    } catch(err){
      data.msg = '[PASO 8] - Error al cerrar la orden de entrega. (comparacion totales)';
      callback(err, data);
    }

    callback(null, connection, data);
  });
}

//******************************************************************************
// PASO 9: [QUERIES]
//  9.1. Se ingresan los metodos de pago de la orden de entrega.
//  9.2. Se ingresan las deudas del cliente. Cta Cte.
//  9.3: Se ingresan los pagos efectivos como el detalle de una subcuenta.
//******************************************************************************
function _paso9CloseDeliveryOrder(connection, data, callback){
  var qry = '';
  var qry_callback = '';
  var parametros = [];

  //******************************************************************************
  // PASO 9.1. Se ingresan los metodos de pago de la orden de entrega.
  //******************************************************************************
  qry = 'INSERT INTO basket_order_payment ';
  qry += ' (id_payment_method, id_basket_order, amount, id_user_created ) ';
  qry += 'VALUES ?;';
  parametros.push(data.basket_order_payment_array_insert);

  //******************************************************************************
  // PASO 9.2. Se ingresan las deudas del cliente. Cta Cte.
  //******************************************************************************
  qry += 'INSERT INTO user_payment_detail ';
  qry += ' (id_user_payment, id_basket_order, sign, amount, id_user_created) ';
  qry += 'SELECT ';
  qry += '  ? id_user_payment, ';
  qry += '  ? id_basket_order, ';
  qry += '  ? sign, ';
  qry += '  bop.amount, ';
  qry += '  ? id_user_created ';
  qry += 'FROM ';
  qry += '  basket_order_payment bop ';
  qry += 'WHERE ';
  qry += '  bop.id_basket_order = ? ';
  qry += '  AND bop.id_payment_method = ?; ';
  parametros.push(data.id_user_payment);
  parametros.push(data.id_basket_order);
  parametros.push(globals.PAGOS.SUMA);
  parametros.push(data.id_user_created);
  parametros.push(data.id_basket_order);
  parametros.push(globals.PAGOS.CTA_CORRIENTE);

  //******************************************************************************
  // PASO 9.3. Se ingresan los pagos efectivos como el detalle de una subcuenta.
  //******************************************************************************
  qry += 'INSERT INTO subaccount_detail ';
  qry += '  (id_subaccount, id_zone, id_basket_order, amount, subaccount_date, id_user_created) ';
  qry += 'SELECT ';
  qry += '  sacc.id_subaccount, ';
  qry += '  ? id_zone, ';
  qry += '  ? id_basket_order, ';
  qry += '  SUM(bop.amount) amount, ';
  qry += '  CURDATE() subaccount_date, ';
  qry += '  ? id_user_created ';
  qry += 'FROM ';
  qry += '  basket_order_payment bop ';
  qry += '  JOIN subaccount sacc ON(id_subaccount = ?) ';
  qry += 'WHERE ';
  qry += '  bop.id_basket_order = ? ';
  qry += '  AND bop.id_payment_method = ?; ';
  parametros.push(data.id_zone);
  parametros.push(data.id_basket_order);
  parametros.push(data.id_user_created);
  parametros.push(globals.SUBCUENTAS.VENTAS_COBRADAS);
  parametros.push(data.id_basket_order);
  parametros.push(globals.PAGOS.CAJA);
  qry_callback = connection.query(qry, parametros, function(err, results) {
    console.log(qry_callback.sql);
    if (err) {
      data.msg = '[PASO 9] - Error al cerrar la orden de entrega.';
      console.log(err);
      callback(err, data);
    }

    try{
      data.id_subaccount_detail = results[2].insertId;
    } catch(err){
      data.msg = '[PASO 9] - Error al cerrar la orden de entrega. (insertId)';
      callback(err, data);
    }

    callback(null, connection, data);
  });
}

//******************************************************************************
// PASO 10: [QUERIES]
//  10.1. Temporal de la caja, para obtener la ultima caja.
//  10.2. Agrego la relacion del detalle de la ultima subcuenta ingresada.
//******************************************************************************
function _paso10CloseDeliveryOrder(connection, data, callback){
  var qry = '';
  var qry_callback = '';
  var parametros = [];

  //****************************************************************************
  // PASO 10.1. Temporal de la caja, para obtener la ultima caja.
  //****************************************************************************
  qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_cash;';
  qry += 'CREATE TEMPORARY TABLE tmp_cash ';
  qry += 'SELECT ';
  qry += ' MAX(id_cash) id_cash ';
  qry += 'FROM ';
  qry += '  cash ';
  qry += 'WHERE ';
  qry += '  cash.id_zone = ? ';
  qry += '  AND cash.id_status = ?; ';
  parametros.push(data.id_zone);
  parametros.push(globals.ACTIVO);

  //****************************************************************************
  // PASO 10.2. Agrego la relacion del detalle de la ultima subcuenta ingresada.
  //****************************************************************************
  qry += 'INSERT INTO cash_detail ';
  qry += '  (id_cash, id_subaccount_detail, id_user_created) ';
  qry += 'SELECT ';
  qry += '  tc.id_cash, ';
  qry += '  ? id_subaccount_detail, ';
  qry += '  ? id_user_created ';
  qry += 'FROM ';
  qry += '  tmp_cash tc ;';
  parametros.push(data.id_subaccount_detail);
  parametros.push(data.id_user_created);
  qry_callback = connection.query(qry, parametros, function(err, results) {
    console.log(qry_callback.sql);
    if (err) {
      data.msg = '[PASO 10] - Error al cerrar la orden de entrega.';
      callback(err, data);
    }

    callback(null, data);
  });
}

/**
 * Deliverie Articles middleware
 */
exports.deliveryOrderByID = function(req, res, next, id_basket_order) {
  var qry = '';
  var qry_callback = '';
  req.getConnection(function(err, connection) {
    if (err) {
      return next(err);
    }

    //Config inicial de los datos.
    var data = {};
    data.msg = 'TODO OK';
    data.id_basket_order = id_basket_order;

    //Proceso de busqueda de la orden de entrega.
    async.waterfall([
      _getDeliveryOrder(connection, data),
      _getArticlesDeliveryOrder
    ], function (err, data) {
      if(err){
        if(data.no_existe){
          return res.status(404).send({
            message: data.msg
          });
        }
        return next(err);
      }

      req.delivery_order = data.delivery_order;
      req.delivery_order.articles = data.results[0];
      req.delivery_order.complex_articles = data.results[1];
      req.delivery_order.articulos_in_complex = data.articulos;
      next();
    });
  });
};

function _getDeliveryOrder(connection, data, callback){
  return function (callback) {
    var qry_callback;
    var qry;

    //Se obtiene la canasta solicitada.
    qry = 'SELECT ';
    qry += '  bo.*, ';
    qry += '  st.name status_name, ';
    qry += '  u.display_name, ';
    qry += '  CONCAT(u.first_name, " ", u.last_name) user_name ';
    qry += 'FROM ';
    qry += '  basket_order bo ';
    qry += '  JOIN status st USING(id_status) ';
    qry += '  JOIN user u USING(id_user) ';
    qry += 'WHERE ';
    qry += '  bo.id_basket_order = ?; ';
    qry_callback = connection.query(qry, [data.id_basket_order], function(err, delivery_order) {
      console.log(qry_callback.sql);
      if (err) {
        data.msg = 'Error al obtener la orden de entrega.';
        callback(err, data);
      }

      //No existe la orden solicitada.
      if(!delivery_order.length){
        data.no_existe = true;
        data.msg = 'No existe la orden de entrega.';
        callback(new Error('No existe la orden de entrega.'), data);
      }

      data.no_existe = false;
      data.delivery_order = delivery_order[0];
      callback(null, connection, data);
    });
  };
}

function _getArticlesDeliveryOrder(connection, data, callback){
  var qry_callback;
  var qry;

  //Articulos de la canasta.
  qry = 'SELECT ';
  qry += '  a.*, ';
  qry += '  b.id_status status_basket, ';
  qry += '  mu.abbreviation measurement_unit_abbreviation, ';
  qry += '  mu.abbreviation measurement_unit_abbreviation_plural, ';
  qry += '  mue.abbreviation measurement_unit_equivalence_abbreviation, ';
  qry += '  mue.abbreviation_plural measurement_unit_equivalence_abbreviation_plural, ';
  qry += '  CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0), "", LPAD(a.code, 3, 0)) full_code, ';
  qry += '  b.id_basket, ';
  qry += '  b.gift, ';
  qry += '  b.amount, ';
  qry += '  b.price, ';
  qry += '  b.price * b.amount total, ';
  qry += '  b.amount * a.equivalence cantidad ';
  qry += 'FROM ';
  qry += '  basket b ';
  qry += '  JOIN article a USING(id_article) ';
  qry += '  JOIN measurement_unit mu ON(mu.id_measurement_unit = a.id_measurement_unit) ';
  qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
  qry += '  JOIN subgroup sg USING(id_subgroup) ';
  qry += '  JOIN grupo g USING(id_group) ';
  qry += 'WHERE ';
  qry += '  b.id_basket_order = ?; ';

  //Articulos complejos de la canasta.
  qry += 'SELECT ';
  qry += '  a.*, ';
  qry += '  b.id_status status_basket, ';
  qry += '  CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0), "", LPAD(a.code, 8, 0)) full_code, ';
  qry += '  b.id_basket, ';
  qry += '  b.gift, ';
  qry += '  b.amount, ';
  qry += '  b.price, ';
  qry += '  b.price * b.amount total ';
  qry += 'FROM ';
  qry += '  basket b ';
  qry += '  JOIN complex_article a USING(id_complex_article) ';
  qry += '  JOIN subgroup sg USING(id_subgroup) ';
  qry += '  JOIN grupo g USING(id_group) ';
  qry += 'WHERE ';
  qry += '  b.id_basket_order = ?; ';

  //Articulos que forman parte de los articulos complejos.
  qry += 'SELECT ';
  qry += '  cad.id_complex_article, ';
  qry += '  cad.scale_complex, ';
  qry += '  cad.equivalence_complex, ';
  qry += '  a.*, ';
  qry += '  mu.name measurement_unit_name, ';
  qry += '  mu.abbreviation measurement_unit_abbreviation, ';
  qry += '  mu.abbreviation_plural measurement_unit_abbreviation_plural, ';
  qry += '  mue.name measurement_unit_name_complex, ';
  qry += '  muc.abbreviation measurement_unit_abbreviation_complex, ';
  qry += '  muc.abbreviation measurement_unit_abbreviation_plural_complex, ';
  qry += '  mue.name measurement_unit_equivalence_name, ';
  qry += '  mue.abbreviation measurement_unit_equivalence_abbreviation, ';
  qry += '  mue.abbreviation_plural measurement_unit_equivalence_abbreviation_plural, ';
  qry += '  sg.name subgroup_name, ';
  qry += '  CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0), "", LPAD(a.code, 3, 0)) full_code, ';
  qry += '  g.name group_name ';
  qry += 'FROM ';
  qry += '  basket b ';
  qry += '  JOIN complex_article_detail cad USING(id_complex_article) ';
  qry += '  JOIN article a ON(a.id_article = cad.id_article) ';
  qry += '  JOIN measurement_unit mu ON(mu.id_measurement_unit = a.id_measurement_unit) ';
  qry += '  JOIN measurement_unit muc ON(muc.id_measurement_unit = cad.id_measurement_unit) ';
  qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
  qry += '  JOIN subgroup sg ON(sg.id_subgroup = a.id_subgroup) ';
  qry += '  JOIN grupo g USING(id_group) ';
  qry += 'WHERE ';
  qry += '  b.id_basket_order = ?; ';
  qry_callback = connection.query(qry, [data.id_basket_order, data.id_basket_order, data.id_basket_order], function(err, results) {
    console.log(qry_callback.sql);
    if (err) {
      data.msg = 'Error al obtener los articulos de la orden de entrega.';
      callback(err, data);
    }

    //Se obtienen los articulos que forman parte del articulo complejo.
    var articles = results[2];
    var articulos = {};
    async.eachSeries(articles, function(article, callback) {
      if(!(article.id_complex_article in articulos)){
        articulos[article.id_complex_article] = [];
      }
      articulos[article.id_complex_article].push(article);
      callback();
    }, function(err) {
      if(err) {
        data.msg = 'Error al obtener los articulos complejos de la orden de entrega.';
        callback(err, data);
      }

      data.results = results;
      data.articulos = articulos;
      callback(null, data);
    });
  });
}
