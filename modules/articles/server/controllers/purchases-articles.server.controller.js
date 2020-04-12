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
 * Show the current PurchaseOrder.
 */
exports.read = function(req, res) {
  var purchase_order = req.purchase_order ? req.purchase_order : {};
  res.jsonp(purchase_order);
};

/**
 * Add a new purchase order.
 * @param {[type]} req [description]
 * @param {[type]} res [description]
 */
exports.add_purchase_order = function(req, res){
  var id_zone = req.body.id_zone;

  var msg = 'TODO OK';
  var error = false;
  var qry = '';
  req.getConnection(function(err, connection) {
    if (err) {
      msg = 'Error al cargar las compras.';
      error = true;
      res.jsonp([{ error: error, msg: msg }]);
      return;
    }
    qry = 'SELECT MAX(number) number FROM purchase_order WHERE id_zone = ?; ';
    connection.query(qry, [id_zone], function(err, purchase_order) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      if(!purchase_order.length){
        return res.status(400).send({
          message: 'No se pudo crear Orden de Compra.'
        });
      }
      var number = parseInt(purchase_order[0].number) + 1;
      qry = 'INSERT INTO purchase_order SET ?; ';
      connection.query(qry, { id_zone: id_zone, number: number }, function(err, result) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        res.jsonp([{ error: error, msg: msg }]);
      });
    });
  });
};

/**
 * Metodo encargado de recorrer todos los articulos
 * de los cuales se van a cargar las compras.
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.load_purchase = function(req, res) {
  var articulos_errores = [];
  var msg = 'TODO OK';
  var error = false;
  var id_purchase_order = req.body.id_purchase_order;
  var articles = req.body.articles;
  var id_location = req.body.id_location;
  var id_zone = req.body.id_zone;

  var qry = '';
  var qry_callback = '';

  //Recorro todos los articulos enviados.
  var purchase_array_insert = [];
  var articles_in = [];
  async.eachSeries(articles, function(article, callback) {
    //Se cheque por la validez de los campos del articulo enviado.
    var codigo_control = shared.controlCargaOrdenCompra(article);
    if(codigo_control === 0){
      callback('Existen artículos con valores inconsistentes.');
      return;
    }
    var purchase_array = [
      id_purchase_order,
      article.id_article,
      article.amount,
      article.total_dirty,
      article.total_waste,
      article.total_clean,
      article.total_price,
      article.price
    ];
    purchase_array_insert.push(purchase_array);
    articles_in.push(article.id_article);
    callback();
  }, function(err) {
    if(err) {
      msg = err;
      error = true;
      res.jsonp([{ articulos_errores: articulos_errores, error: error, msg: msg }]);
      return;
    }
    if(purchase_array_insert.length > 0){
      req.getConnection(function(err, connection) {
        if (err) {
          msg = 'Error al cargar las compras.';
          error = true;
          res.jsonp([{ articulos_errores: articulos_errores, error: error, msg: msg }]);
          return;
        }

        //Verifico si es una carga o una oc que ya fue cerrada y la estoy editando.
        qry = 'SELECT 1 FROM purchase_order WHERE id_purchase_order = ? AND id_status = ?; ';
        qry_callback = connection.query(qry, [id_purchase_order, globals.OC_FINALIZADA], function(err, result) {
          if (err) {
            msg = 'Error al cargar las compras.';
            error = true;
            res.jsonp([{ articulos_errores: articulos_errores, error: error, msg: msg }]);
            return;
          }

          //Carga normal.
          if(!result.length){
            qry = 'REPLACE INTO purchase (id_purchase_order, id_article, amount, total_dirty, total_waste, total_clean, total_price, price) VALUES ?; ';
            qry_callback = connection.query(qry, [purchase_array_insert], function(err, result) {
              console.log(qry_callback.sql);
              if (err) {
                msg = 'Error al cargar las compras.';
                error = true;
                res.jsonp([{ articulos_errores: articulos_errores, error: error, msg: msg }]);
                return;
              }
              res.jsonp([{ articulos_errores: articulos_errores, error: error, msg: msg }]);
            });
          } else{//edicion de la orden de compra.
            // var data = {};
            // data.id_purchase_order = id_purchase_order;
            // data.articles_in = articles_in;
            // data.id_location = id_location;
            // data.id_zone = id_zone;
            // data.purchase_array_insert = purchase_array_insert;
            // data.msg = 'TODO OK';
            // purchase_edition(res, connection, data);
          }
        });
      });
    } else {
      msg = 'Error al cargar las compras.';
      error = true;
      res.jsonp([{ articulos_errores: articulos_errores, error: error, msg: msg }]);
      return;
    }
  });
};

/**
 * Obtener el listado de ordenes de compra de una zona en particular.
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.list_purchases = function(req, res) {
  //Si se envio filtro por subgrupo.
  if(req.query.id_zone === undefined || req.query.id_zone === null){
    return res.status(400).send({
      message: 'Debe ingresar la zona.'
    });
  }

  var qry = '';
  var qry_callback;
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    var id_zone = req.query.id_zone;
    var count = req.query.count || 5;
    var page = req.query.page || 1;

    //WHERE.
    var where = mysql_helper.getWhereFilterArticles(connection, req.query.filter);
    if(where !== ''){
      where += 'AND po.id_zone = ' + connection.escape(id_zone) + ' ';
    } else{
      where += 'WHERE ';
      where += '    po.id_zone = ' + connection.escape(id_zone) + ' ';
    }

    //ORDER BY.
    var order_by = mysql_helper.getOrderBy('po.number', req.query.sorting);

    //LIMIT.
    var rtdo_limit_pag = mysql_helper.getLimitAndPagination(page, count);
    var pagination = rtdo_limit_pag.pagination;
    var limit = rtdo_limit_pag.limit;

    var qry = '';
    qry += 'SELECT ';
    qry += '  COUNT(*) total_count ';
    qry += 'FROM ';
    qry += '  purchase_order po ';
    qry += '  JOIN status st USING(id_status) ';
    qry += where;
    qry += ';';
    qry += 'SELECT ';
    qry += '  po.*, ';
    qry += '  st.name status_name, ';
    qry += '  IF(DATE(po.created) = CURDATE(), 1, 0) allow_edit, ';
    qry += '  IF(po.id_status = ?, 1, 0) loading ';
    qry += 'FROM ';
    qry += '  purchase_order po ';
    qry += '  JOIN status st USING(id_status) ';
    qry += where;
    qry += order_by;
    qry += limit;
    qry_callback = connection.query(qry, [globals.OC_ACTIVA], function(err, results) {
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
      var articles = results[1];
      var result = mysql_helper.getResult(articles, total_count, pagination);

      res.jsonp(result);
    });
  });
};

/**
 * Se obtiene la orden de compra solicitada.
 * @param  {[type]}   req               [description]
 * @param  {[type]}   res               [description]
 * @param  {Function} next              [description]
 * @param  {[type]}   id_purchase_order [description]
 * @return {[type]}                     [description]
 */
exports.purchaseOrderByID = function(req, res, next, id_purchase_order) {
  var qry = '';
  var qry_callback;
  req.getConnection(function(err, connection) {
    if (err) {
      return next(err);
    }
    qry = 'SELECT ';
    qry += '  po.*, ';
    qry += '  z.id_location, ';
    qry += '  st.name status_name, ';
    qry += '  IF(DATE(po.created) = CURDATE(), 1, 0) allow_edit, ';
    qry += '  IF(po.id_status = ?, 1, 0) loading ';
    qry += 'FROM ';
    qry += '  purchase_order po ';
    qry += '  JOIN status st USING(id_status) ';
    qry += '  JOIN zone z USING(id_zone) ';
    qry += 'WHERE ';
    qry += '  po.id_purchase_order = ? ';
    qry += '; ';
    qry_callback = connection.query(qry, [globals.OC_ACTIVA, id_purchase_order], function(err, purchase_order) {
      console.log(qry_callback.sql);
      if (err) {
        return next(err);
      } else if (!purchase_order.length) {
        return res.status(404).send({
          message: 'No se ha encontrado la orden de compra.'
        });
      }

      req.purchase_order = purchase_order[0];
      next();
    });
  });
};

/**
 * Get all articles belonging to the purchase order.
 */
exports.get_articles = function(req, res) {
  var qry = '';
  var qry_callback;
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: 'Error al obtener los articulos de la orden de compra.'
      });
    }

    var id_purchase_order = req.query.id_purchase_order;
    var id_location = req.query.id_location;

    var count = req.query.count || 5;
    var page = req.query.page || 1;

    //WHERE.
    var where = mysql_helper.getWhereFilterArticles(connection, req.query.filter);
    if(where !== ''){
      where += 'AND p.id_purchase_order = ' + connection.escape(id_purchase_order) + ' ';
    } else{
      where += 'WHERE ';
      where += '    p.id_purchase_order = ' + connection.escape(id_purchase_order) + ' ';
    }

    //ORDER BY.
    var order_by = mysql_helper.getOrderBy('a.name', req.query.sorting);

    //LIMIT.
    var rtdo_limit_pag = mysql_helper.getLimitAndPagination(page, count);
    var pagination = rtdo_limit_pag.pagination;
    var limit = rtdo_limit_pag.limit;

    var qry = '';
    qry += 'SELECT ';
    qry += '  COUNT(*) total_count, ';
    qry += '  SUM(p.total_price) total_valued ';
    qry += 'FROM ';
    qry += '  article a ';
    qry += '  JOIN measurement_unit mu USING(id_measurement_unit) ';
    qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
    qry += '  JOIN subgroup sg USING(id_subgroup) ';
    qry += '  JOIN grupo g USING(id_group) ';
    qry += '  JOIN purchase p USING(id_article) ';
    qry += '  LEFT JOIN purchase_order_provider pop USING(id_purchase_order, id_article) ';
    qry += '  LEFT JOIN provider pr USING(id_provider) ';
    qry += '  LEFT JOIN brand b USING(id_brand) ';
    qry += '  LEFT JOIN article_location al ON(al.id_location = ? AND al.id_article = a.id_article) ';
    qry += where;
    qry += ';';
    qry += 'SELECT ';
    qry += '  a.*, ';
    qry += '  IF(al.id_article IS NULL, 0, 1) enabled, ';
    qry += '  mu.name measurement_unit_name, ';
    qry += '  mu.abbreviation measurement_unit_abbreviation, ';
    qry += '  mu.abbreviation_plural measurement_unit_abbreviation_plural, ';
    qry += '  mue.name measurement_unit_equivalence_name, ';
    qry += '  mue.abbreviation measurement_unit_equivalence_abbreviation, ';
    qry += '  mue.abbreviation_plural measurement_unit_equivalence_abbreviation_plural, ';
    qry += '  sg.name subgroup_name, ';
    qry += '  CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0), "", LPAD(a.code, 3, 0)) full_code, ';
    qry += '  b.name brand_name, ';
    qry += '  p.amount, ';
    qry += '  p.total_dirty, ';
    qry += '  p.total_waste, ';
    qry += '  p.total_clean, ';
    qry += '  p.total_price, ';
    qry += '  p.price, ';
    qry += '  IF(pop.id_purchase_order_provider IS NOT NULL, pop.id_provider, NULL) id_provider ';
    qry += 'FROM ';
    qry += '  article a ';
    qry += '  JOIN measurement_unit mu USING(id_measurement_unit) ';
    qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
    qry += '  JOIN subgroup sg USING(id_subgroup) ';
    qry += '  JOIN grupo g USING(id_group) ';
    qry += '  JOIN purchase p USING(id_article) ';
    qry += '  LEFT JOIN purchase_order_provider pop USING(id_purchase_order, id_article) ';
    qry += '  LEFT JOIN provider pr USING(id_provider) ';
    qry += '  LEFT JOIN brand b USING(id_brand) ';
    qry += '  LEFT JOIN article_location al ON(al.id_location = ? AND al.id_article = a.id_article) ';
    qry += where;
    qry += order_by;
    qry += limit;
    qry_callback = connection.query(qry, [id_location, id_location], function(err, results) {
      console.log(qry_callback.sql);
      if (err) {
        return res.status(400).send({
          message: 'Error al obtener los articulos de la orden de compra.'
        });
      }

      var total_count = 0;
      var total_valued = 0;
      if(results[0].length){
        total_count = results[0][0].total_count;
        total_valued = results[0][0].total_valued;
      }
      var articles = results[1];
      var result = mysql_helper.getResult(articles, total_count, pagination);
      result.total_valued = total_valued;

      res.jsonp(result);
    });
  });
};

exports.get_payments = function(req, res) {
  var qry = '';
  var qry_callback;
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: 'Error al obtener los articulos de la orden de compra.'
      });
    }

    var id_purchase_order = req.query.id_purchase_order;

    var count = req.query.count || 5;
    var page = req.query.page || 1;

    //WHERE.
    var where = mysql_helper.getWhereFilterProvider(connection, req.query.filter);
    if(where !== ''){
      where += 'AND pop.id_purchase_order = ' + connection.escape(id_purchase_order) + ' ';
    } else{
      where += 'WHERE ';
      where += '    pop.id_purchase_order = ' + connection.escape(id_purchase_order) + ' ';
    }

    //ORDER BY.
    var order_by = mysql_helper.getOrderByProvider('p.nombre_fantasia', req.query.sorting);

    //LIMIT.
    var rtdo_limit_pag = mysql_helper.getLimitAndPagination(page, count);
    var pagination = rtdo_limit_pag.pagination;
    var limit = rtdo_limit_pag.limit;

    var qry = '';
    qry += 'SELECT ';
    qry += '  COUNT(*) total_count, ';
    qry += '  SUM(pop.amount) total_valued_payments ';
    qry += 'FROM ';
    qry += '  purchase_order_payment pop  ';
    qry += '  JOIN provider p USING(id_provider) ';
    qry += '  JOIN payment_method pm USING(id_payment_method) ';
    qry += where;
    qry += ';';
    qry += 'SELECT ';
    qry += '  pop.*, ';
    qry += '  p.*, ';
    qry += '  pm.description payment_description ';
    qry += 'FROM ';
    qry += '  purchase_order_payment pop  ';
    qry += '  JOIN provider p USING(id_provider) ';
    qry += '  JOIN payment_method pm USING(id_payment_method) ';
    qry += where;
    qry += order_by;
    qry += limit;
    qry_callback = connection.query(qry, [], function(err, results) {
      console.log(qry_callback.sql);
      if (err) {
        return res.status(400).send({
          message: 'Error al obtener los pagos de la orden de compra.'
        });
      }
      var total_count = 0;
      var total_valued_payments = 0;
      if(results[0].length){
        total_count = results[0][0].total_count;
        total_valued_payments = results[0][0].total_valued_payments;
      }
      var payments = results[1];
      var result = mysql_helper.getResult(payments, total_count, pagination);
      result.total_valued_payments = total_valued_payments;

      res.jsonp(result);
    });
  });
};

/**
 * Add an article to a purchase.
 * @param {[type]} req [description]
 * @param {[type]} res [description]
 */
exports.add_article = function(req, res){
  var id_purchase_order = req.body.id_purchase_order;
  var id_article = req.body.id_article;
  var id_location = req.body.id_location;
  var id_zone = req.body.id_zone;

  var msg = 'TODO OK';
  var error = false;
  var qry = '';
  req.getConnection(function(err, connection) {
    if (err) {
      msg = 'Error al cargar las compras.';
      error = true;
      res.jsonp([{ error: error, msg: msg }]);
      return;
    }
    if(id_purchase_order === undefined || id_purchase_order === null){
      qry = 'SELECT MAX(number) number FROM purchase_order WHERE id_zone = ?; ';
      connection.query(qry, [id_zone], function(err, purchase_order) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        if(!purchase_order.length){
          return res.status(400).send({
            message: 'No se pudo crear Orden de Compra.'
          });
        }
        var number = parseInt(purchase_order[0].number) + 1;
        qry = 'INSERT INTO purchase_order SET ?; ';
        connection.query(qry, { id_zone: id_zone, number: number }, function(err, result) {
          if (err) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          }
          id_purchase_order = result.insertId;
          var purchase = {
            id_purchase_order: id_purchase_order,
            id_article: id_article
          };
          qry = 'INSERT INTO purchase SET ?; ';
          connection.query(qry, purchase, function(err, result) {
            if (err) {
              msg = 'Error al insertar artículo en la orden de compra.';
              error = true;
              res.jsonp([{ error: error, msg: msg }]);
              return;
            }
            res.jsonp([{ error: error, msg: msg }]);
          });
        });
      });
    } else{
      var purchase = {
        id_purchase_order: id_purchase_order,
        id_article: id_article
      };
      qry = 'INSERT IGNORE INTO purchase SET ?; ';
      connection.query(qry, purchase, function(err, result) {
        if (err) {
          msg = 'Error al insertar artículo en la orden de compra.';
          error = true;
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }
        res.jsonp([{ error: error, msg: msg }]);
      });
    }
  });
};

/**
 * Load Provider.
 * @param {[type]} req [description]
 * @param {[type]} res [description]
 */
exports.load_provider = function(req, res){
  var id_purchase_order = req.body.id_purchase_order;
  var id_article = req.body.id_article;
  var id_location = req.body.id_location;
  var id_zone = req.body.id_zone;
  var id_provider = req.body.id_provider;

  var qry_callback;
  var qry = '';
  req.getConnection(function(err, connection) {
    if (err) {
      res.jsonp([{ error: true, msg: 'Error al cargar el proveedor.' }]);
      return;
    }

    //Verifico si es una carga o una oc que ya fue cerrada y la estoy editando.
    qry = 'SELECT 1 FROM purchase_order WHERE id_purchase_order = ? AND id_status = ?; ';
    qry_callback = connection.query(qry, [id_purchase_order, globals.OC_FINALIZADA], function(err, result) {
      if (err) {
        res.jsonp([{ error: true, msg: 'Error al cargar el proveedor.' }]);
        return;
      }

      //Carga normal.
      if(!result.length){
        var purchase_order_provider = {
          id_purchase_order: id_purchase_order,
          id_article: id_article,
          id_provider: id_provider,
          id_user_created: req.user.id_user
        };
        qry = 'REPLACE INTO purchase_order_provider SET ?; ';
        qry_callback = connection.query(qry, [purchase_order_provider], function(err, result) {
          console.log(qry_callback.sql);
          if (err) {
            res.jsonp([{ error: true, msg: 'Error al cargar el proveedor.' }]);
            return;
          }
          res.jsonp([{ error: false, msg: 'TODO OK' }]);
        });
      } else{//edicion de la orden de compra.
        // var data = {};
        // data.id_purchase_order = id_purchase_order;
        // data.id_article = id_article;
        // data.id_location = id_location;
        // data.id_zone = id_zone;
        // data.id_provider = id_provider;
        // data.id_user_modified = req.user.id_user;
        // data.msg = 'TODO OK';
        // purchase_edition_provider(res, connection, data);
      }
    });
  });
};

/**
 * Funcion para chequear la consistencia de los datos
 * antes de cerrar la orden de compra.
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.check_consistency = function(req, res){
  var id_purchase_order = req.body.id_purchase_order;
  var id_location = req.body.id_location;
  var id_zone = req.body.id_zone;

  var msg = 'TODO OK';
  var error = false;
  var code = globals.OK;
  var qry = '';
  var qry_callback = '';
  if(id_purchase_order === undefined || id_purchase_order === null){
    msg = 'Error al cerrar la orden de compra.';
    error = true;
    res.jsonp([{ error: error, msg: msg }]);
    return;
  }
  req.getConnection(function(err, connection) {
    if (err) {
      msg = 'Error al cerrar la orden de compra.';
      error = true;
      res.jsonp([{ error: error, msg: msg }]);
      return;
    }

    //Se realizan los controles de los valores cargados.
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
    qry += '  p.amount, ';
    qry += '  p.total_dirty, ';
    qry += '  p.total_waste, ';
    qry += '  p.total_clean, ';
    qry += '  p.total_price, ';
    qry += '  p.price ';
    qry += 'FROM ';
    qry += '  article a ';
    qry += '  JOIN measurement_unit mu USING(id_measurement_unit) ';
    qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
    qry += '  JOIN subgroup sg USING(id_subgroup) ';
    qry += '  JOIN grupo g USING(id_group) ';
    qry += '  JOIN purchase p USING(id_article) ';
    qry += '  LEFT JOIN brand b USING(id_brand) ';
    qry += 'WHERE ';
    qry += '  p.id_purchase_order = ? ';
    qry += '  AND ( ';
    qry += '    p.total_dirty IS NULL OR total_dirty <= 0 ';
    qry += '    OR p.total_waste IS NULL OR total_waste < 0 ';
    qry += '    OR p.total_clean IS NULL OR total_clean <= 0 ';
    qry += '    OR p.total_price IS NULL OR total_price <= 0 ';
    qry += '    OR p.price IS NULL OR price <= 0 ';
    qry += '  ) ';
    qry += '; ';
    qry_callback = connection.query(qry, [id_purchase_order], function(err, articles) {
      console.log(qry_callback.sql);
      if (err) {
        msg = 'Error al cerrar la orden de compra.';
        error = true;
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      //Se encontraron articulos de la oc en estado inconsistente.
      if(articles.length){
        msg = 'Existen artículos con valores inconsistentes.';
        error = false;
        code = globals.WARNING_ARTICULOS_EN_CERO;
        res.jsonp([{ error: error, code: code, msg: msg, articles: articles }]);
        return;
      }
      res.jsonp([{ error: error, code: code, msg: msg }]);
    });
  });
};

/**
 * Finished loading purchases.
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.close_purchase_order = function(req, res){
  var id_purchase_order = req.body.id_purchase_order;
  var id_location = req.body.id_location;
  var id_zone = req.body.id_zone;

  if(id_purchase_order === undefined || id_purchase_order === null){
    res.jsonp([{ error: true, msg: 'Error al cerrar la orden de compra.' }]);
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
        res.jsonp([{ error: true, msg: '[BTransaction] - Error al cerra la orden de compra.' }]);
        return;
      }

      var data = {};
      data.id_purchase_order = id_purchase_order;
      data.id_location = id_location;
      data.id_zone = id_zone;
      data.code = globals.OK;
      data.msg = 'TODO OK';

      //Inicia proceso de cierre en cascada.
      async.waterfall([
        _paso1ClosePurchaseOrder(connection, data),
        _paso2ClosePurchaseOrder,
        _paso3ClosePurchaseOrder,
        _paso4ClosePurchaseOrder
      ], function (err, data) {
        if(err){
          return connection.rollback(function() {
            res.jsonp([{ error: true, msg: data.msg }]);
            return;
          });
        }

        //COMMIT.
        connection.commit(function(err) {
          if (err) {
            return connection.rollback(function() {
              res.jsonp([{ error: true, msg: '[CTransaction] - Error al cerrar la orden de compra.' }]);
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
// PASO 1: [QUERIES]
//  1.1. Temporal de fechas del stock.
//  1.2. Se crea la temporal del stock segun la orden de compra.
//  1.3. Se inserta en el stock.
//  1.4. Se actualiza el estado de la oc.
//******************************************************************************
function _paso1ClosePurchaseOrder(connection, data, callback){
  return function (callback) {
    var qry = '';
    var qry_callback = '';
    var parametros = [];

    //**************************************************************************
    // PASO 1.1. Temporal de fechas del stock.
    //**************************************************************************
    qry = 'DROP TEMPORARY TABLE IF EXISTS tmp_stock_date; ';
    qry += 'CREATE TEMPORARY TABLE tmp_stock_date ';
    qry += 'SELECT ';
    qry += '  st.id_article, ';
    qry += '  MAX(st.stock_date) stock_date ';
    qry += 'FROM ';
    qry += '  stock st ';
    qry += 'WHERE ';
    qry += '  st.id_zone = ? ';
    qry += 'GROUP BY st.id_article;';
    parametros.push(data.id_zone);

    //**************************************************************************
    // PASO 1.2. Se crea la temporal del stock segun la orden de compra.
    //**************************************************************************
    qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_stock; ';
    qry += 'CREATE TEMPORARY TABLE tmp_stock ';
    qry += 'SELECT ';
    qry += '  po.id_zone, ';
    qry += '  p.id_article, ';
    qry += '  CURDATE() stock_date, ';
    qry += '  IF(st.id_stock IS NOT NULL, st.total + p.total_clean, p.total_clean) total, ';
    qry += '  IF(st.id_stock IS NOT NULL, st.total_purchase_order + IF(p.amount > 0, total_clean, 0), IF(p.amount > 0, total_clean, 0)) total_purchase_order, ';
    qry += '  IF(st.id_stock IS NOT NULL, st.total_purchase_order_impulsive + IF(p.amount = 0, total_clean, 0), IF(p.amount = 0, total_clean, 0)) total_purchase_order_impulsive, ';
    qry += '  p.total_waste, ';
    qry += '  (p.total_price/p.total_clean) price ';
    qry += 'FROM ';
    qry += '  purchase_order po ';
    qry += '  JOIN purchase p USING(id_purchase_order) ';
    qry += '  LEFT JOIN tmp_stock_date tstd USING(id_article) ';
    qry += '  LEFT JOIN stock st ON(st.id_zone = po.id_zone AND st.stock_date = tstd.stock_date AND st.id_article = tstd.id_article) ';
    qry += 'WHERE ';
    qry += '  po.id_purchase_order = ? ';
    qry += '  AND po.id_status = ? ';
    qry += '  AND DATE(po.created) = CURDATE() ';
    qry += '  AND p.total_clean > 0 ';
    qry += '  AND p.price > 0; ';
    parametros.push(data.id_purchase_order);
    parametros.push(globals.OC_ACTIVA);

    //**************************************************************************
    // PASO 1.3. Se inserta en el stock.
    //**************************************************************************
    qry += 'INSERT INTO stock ';
    qry += '  (id_zone, id_article, stock_date, total, total_purchase_order, total_purchase_order_impulsive, price) ';
    qry += 'SELECT ';
    qry += '  st.id_zone, ';
    qry += '  st.id_article, ';
    qry += '  st.stock_date, ';
    qry += '  st.total, ';
    qry += '  st.total_purchase_order, ';
    qry += '  st.total_purchase_order_impulsive, ';
    qry += '  st.price ';
    qry += 'FROM ';
    qry += '  tmp_stock st ';
    qry += 'ON DUPLICATE KEY UPDATE ';
    qry += '  total = st.total, ';
    qry += '  total_purchase_order = st.total_purchase_order, ';
    qry += '  total_purchase_order_impulsive = st.total_purchase_order_impulsive, ';
    qry += '  price = st.price; ';

    //**************************************************************************
    // PASO 1.4. Se actualiza el estado de la oc.
    //**************************************************************************
    qry += 'UPDATE purchase_order SET id_status = ?, modified = NOW() WHERE id_purchase_order = ?; ';
    parametros.push(globals.OC_FINALIZADA);
    parametros.push(data.id_purchase_order);
    qry_callback = connection.query(qry, parametros, function(err, stock_order) {
      console.log(qry_callback.sql);
      if (err) {
        data.msg = '[PASO 1] - Error al cerrar la orden de compra.';
        return callback(err, data);
      }

      callback(null, connection, data);
    });
  };
}

//******************************************************************************
// PASO 2: [QUERIES]
//  2.1. Se ingresa la cuenta de desperdicios.
//******************************************************************************
function _paso2ClosePurchaseOrder(connection, data, callback){
  var qry = '';
  var qry_callback = '';
  var parametros = [];

  //****************************************************************************
  // PASO 2.1. Se ingresa la cuenta de desperdicios.
  //****************************************************************************
  qry += 'INSERT INTO subaccount_detail ';
  qry += '  (id_subaccount, id_zone, id_purchase_order, amount, subaccount_date, id_user_created) ';
  qry += 'SELECT ';
  qry += '  sacc.id_subaccount, ';
  qry += '  ? id_zone, ';
  qry += '  ? id_purchase_order, ';
  qry += '  SUM(st.price * st.total_waste) amount, ';
  qry += '  CURDATE() subaccount_date, ';
  qry += '  ? id_user_created ';
  qry += 'FROM ';
  qry += '  tmp_stock st ';
  qry += '  JOIN subaccount sacc ON(id_subaccount = ?); ';
  parametros.push(data.id_zone);
  parametros.push(data.id_purchase_order);
  parametros.push(data.id_user_created);
  parametros.push(globals.SUBCUENTAS.DESPERDICIO_COMPRA);
  qry_callback = connection.query(qry, parametros, function(err, results) {
    console.log(qry_callback.sql);
    if (err) {
      data.msg = '[PASO 2] - Error al cerrar la orden de compra.';
      console.log(err);
      callback(err, data);
    }

    callback(null, connection, data);
  });
}

//******************************************************************************
// PASO 3: [QUERIES]
//  3.1. Se ingresan las deudas con los proveedores. Cta Cte.
//  3.2: Se ingresan los pagos efectivos como el detalle de una subcuenta.
//******************************************************************************
function _paso3ClosePurchaseOrder(connection, data, callback){
  var qry = '';
  var qry_callback = '';
  var parametros = [];

  //******************************************************************************
  // PASO 3.1. Se ingresan las deudas con los proveedores. Cta Cte.
  //******************************************************************************
  qry += 'INSERT INTO provider_payment_detail ';
  qry += ' (id_provider_payment, id_purchase_order, sign, amount, id_user_created) ';
  qry += 'SELECT ';
  qry += '  pp.id_provider_payment, ';
  qry += '  ? id_purchase_order, ';
  qry += '  ? sign, ';
  qry += '  SUM(pop.amount), ';
  qry += '  ? id_user_created ';
  qry += 'FROM ';
  qry += '  purchase_order_payment pop ';
  qry += '  JOIN provider_payment pp USING(id_provider) ';
  qry += 'WHERE ';
  qry += '  pop.id_purchase_order = ? ';
  qry += '  AND pop.id_payment_method = ? ';
  qry += 'GROUP BY pop.id_provider; ';
  parametros.push(data.id_purchase_order);
  parametros.push(globals.PAGOS.SUMA);
  parametros.push(data.id_user_created);
  parametros.push(data.id_purchase_order);
  parametros.push(globals.PAGOS.CTA_CORRIENTE);

  //******************************************************************************
  // PASO 3.2. Se ingresan los pagos efectivos como el detalle de una subcuenta.
  //******************************************************************************
  qry += 'INSERT INTO subaccount_detail ';
  qry += '  (id_subaccount, id_zone, id_purchase_order, amount, subaccount_date, id_user_created) ';
  qry += 'SELECT ';
  qry += '  sacc.id_subaccount, ';
  qry += '  ? id_zone, ';
  qry += '  ? id_purchase_order, ';
  qry += '  SUM(pop.amount) amount, ';
  qry += '  CURDATE() subaccount_date, ';
  qry += '  ? id_user_created ';
  qry += 'FROM ';
  qry += '  purchase_order_payment pop ';
  qry += '  JOIN subaccount sacc ON(id_subaccount = ?) ';
  qry += 'WHERE ';
  qry += '  pop.id_purchase_order = ? ';
  qry += '  AND pop.id_payment_method = ?; ';
  parametros.push(data.id_zone);
  parametros.push(data.id_purchase_order);
  parametros.push(data.id_user_created);
  parametros.push(globals.SUBCUENTAS.COMPRAS_PAGADAS);
  parametros.push(data.id_purchase_order);
  parametros.push(globals.PAGOS.CAJA);
  qry_callback = connection.query(qry, parametros, function(err, results) {
    console.log(qry_callback.sql);
    if (err) {
      data.msg = '[PASO 3] - Error al cerrar la orden de compra.';
      callback(err, data);
    }

    try{
      data.id_subaccount_detail = results[1].insertId;
    } catch(err){
      data.msg = '[PASO 3] - Error al cerrar la orden de compra. (insertId)';
      callback(err, data);
    }

    callback(null, connection, data);
  });
}

//******************************************************************************
// PASO 4: [QUERIES]
//  4.1. Temporal de la caja, para obtener la ultima caja.
//  4.2. Agrego la relacion del detalle de la ultima subcuenta ingresada.
//******************************************************************************
function _paso4ClosePurchaseOrder(connection, data, callback){
  var qry = '';
  var qry_callback = '';
  var parametros = [];

  //****************************************************************************
  // PASO 4.1. Temporal de la caja, para obtener la ultima caja.
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
  // PASO 4.2. Agrego la relacion del detalle de la ultima subcuenta ingresada.
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
  parametros.push(data.id_zone);
  qry_callback = connection.query(qry, parametros, function(err, results) {
    console.log(qry_callback.sql);
    if (err) {
      data.msg = '[PASO 4] - Error al cerrar la orden de compra.';
      callback(err, data);
    }

    callback(null, data);
  });
}

/**
 * Add a payment to a purchase.
 * @param {[type]} req [description]
 * @param {[type]} res [description]
 */
exports.add_payment_method = function(req, res){
  var id_purchase_order = req.body.id_purchase_order;
  var id_provider = req.body.id_provider;
  var id_payment_method = req.body.id_payment_method;
  var amount = req.body.amount;

  var msg = 'TODO OK';
  var error = false;
  var qry = '';
  var qry_callback = '';
  req.getConnection(function(err, connection) {
    if (err) {
      msg = 'Error al cargar el pago.';
      error = true;
      res.jsonp([{ error: error, msg: msg }]);
      return;
    }
    if(id_purchase_order !== undefined || id_purchase_order !== null){
      var purchase_payment = {
        id_purchase_order: id_purchase_order,
        id_provider: id_provider,
        id_payment_method: id_payment_method,
        amount: amount,
        id_user_created: req.user.id_user
      };
      qry = 'INSERT INTO purchase_order_payment SET ?; ';
      qry_callback = connection.query(qry, purchase_payment, function(err, result) {
        console.log(qry_callback.sql);
        if (err) {
          msg = 'Error al insertar pago en la orden de compra.';
          error = true;
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }
        res.jsonp([{ error: error, msg: msg }]);
      });
    }
  });
};

/**
 * Update payment from a purchase.
 * @param {[type]} req [description]
 * @param {[type]} res [description]
 */
exports.update_payment_method = function(req, res){
  var id_purchase_order_payment = req.body.id_purchase_order_payment;
  var amount = req.body.amount;

  var msg = 'TODO OK';
  var error = false;
  var qry = '';
  var qry_callback = '';
  req.getConnection(function(err, connection) {
    if (err) {
      msg = 'Error al modificar el pago.';
      error = true;
      res.jsonp([{ error: error, msg: msg }]);
      return;
    }

    var purchase_payment_update = {
      amount: amount,
      id_user_modified: req.user.id_user
    };
    qry = 'UPDATE purchase_order_payment SET ?, modified = NOW() WHERE id_purchase_order_payment = ?; ';
    qry_callback = connection.query(qry, [purchase_payment_update, id_purchase_order_payment], function(err, result) {
      console.log(qry_callback.sql);
      if (err) {
        msg = 'Error al modificar pago en la orden de compra.';
        error = true;
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }
      res.jsonp([{ error: error, msg: msg }]);
    });
  });
};

/**
 * Remove payment from a purchase.
 * @param {[type]} req [description]
 * @param {[type]} res [description]
 */
exports.remove_payment_method = function(req, res){
  var id_purchase_order_payment = req.body.id_purchase_order_payment;

  var msg = 'TODO OK';
  var error = false;
  var qry = '';
  var qry_callback = '';
  req.getConnection(function(err, connection) {
    if (err) {
      msg = 'Error al eliminar el pago.';
      error = true;
      res.jsonp([{ error: error, msg: msg }]);
      return;
    }
    qry = 'DELETE FROM purchase_order_payment WHERE id_purchase_order_payment = ?; ';
    qry_callback = connection.query(qry, [id_purchase_order_payment], function(err, result) {
      console.log(qry_callback.sql);
      if (err) {
        msg = 'Error al eliminar pago en la orden de compra.';
        error = true;
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }
      res.jsonp([{ error: error, msg: msg }]);
    });
  });
};
