'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  async = require('async'),
  globals = require(path.resolve('.','./config/globals')),
  mysql_helper = require(path.resolve('.','./config/mysql_helper')),
  multer = require('multer'),
  config = require(path.resolve('./config/config')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

/**
 * Carga el valor del nuevo total del stock.
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.load_stock = function(req, res) {
  var msg = 'TODO OK';
  var error = false;
  if(req.body.id_zone === undefined || req.body.id_zone === null){
    msg = 'Debe ingresar la zona.';
    error = true;
    res.jsonp([{ error: error, msg: msg }]);
    return;
  }
  var id_zone = req.body.id_zone;

  //Articulo.
  var article = req.body.article;
  var id_article = article.id_article;
  var total = article.total;

  var qry = '';
  var qry_callback = '';
  req.getConnection(function(err, connection) {
    if (err) {
      msg = 'Error al cargar el valor del stock.';
      error = true;
      res.jsonp([{ error: error, msg: msg }]);
      return;
    }
    connection.beginTransaction(function(err) {
      if (err) {
        msg = 'Error al cargar el valor del stock.';
        error = true;
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      var parametros = [];
      //Stock Actual.
      qry = 'DROP TEMPORARY TABLE IF EXISTS tmp_stock_date; ';
      qry += 'CREATE TEMPORARY TABLE tmp_stock_date ';
      qry += 'SELECT ';
      qry += '  st.id_article, ';
      qry += '  MAX(st.stock_date) stock_date ';
      qry += 'FROM ';
      qry += '  stock st ';
      qry += 'WHERE ';
      qry += '  st.id_zone = ? ';
      qry += '  AND st.id_article = ? ';
      qry += 'GROUP BY st.id_article;';
      parametros.push(id_zone);
      parametros.push(id_article);

      qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_stock; ';
      qry += 'CREATE TEMPORARY TABLE tmp_stock ';
      qry += 'SELECT ';
      qry += '  ? id_zone, ';
      qry += '  a.id_article, ';
      qry += '  CURDATE() stock_date, ';
      qry += '  ? total, ';
      qry += '  IF(st.id_stock IS NOT NULL, IF(st.total > ?, st.total - ?, 0), 0) total_waste, ';
      qry += '  st.price ';
      qry += 'FROM ';
      qry += '  article a ';
      qry += '  LEFT JOIN tmp_stock_date tstd ON(tstd.id_article = a.id_article) ';
      qry += '  LEFT JOIN stock st ON(tstd.id_article = st.id_article AND tstd.stock_date = st.stock_date AND st.id_zone = ?) ';
      qry += 'WHERE ';
      qry += '  a.id_article = ?;';
      parametros.push(id_zone);
      parametros.push(total);
      parametros.push(total);
      parametros.push(total);
      parametros.push(id_zone);
      parametros.push(id_article);

      qry += 'INSERT INTO stock ';
      qry += '  (id_zone, id_article, stock_date, total, total_waste, price) ';
      qry += 'SELECT ';
      qry += '  st.id_zone, ';
      qry += '  st.id_article, ';
      qry += '  st.stock_date, ';
      qry += '  st.total, ';
      qry += '  st.total_waste, ';
      qry += '  st.price ';
      qry += 'FROM ';
      qry += '  tmp_stock st ';
      qry += 'ON DUPLICATE KEY UPDATE ';
      qry += '  total = st.total, ';
      qry += '  total_waste = st.total_waste, ';
      qry += '  price = st.price ';
      var qry_callback = connection.query(qry, parametros, function(err, stock_order) {
        console.log(qry_callback.sql);
        if (err) {
          msg = 'Error al cargar el valor del stock.';
          error = true;
          return connection.rollback(function() {
            res.jsonp([{ error: error, msg: msg }]);
            return;
          });
        }
        connection.commit(function(err) {
          if (err) {
            msg = 'Error al cargar el valor del stock.';
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
};

/**
 * Carga de marketing que descontara del stock.
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.load_marketing = function(req, res) {
  var msg = 'TODO OK';
  var error = false;
  if(req.body.id_zone === undefined || req.body.id_zone === null){
    msg = 'Debe ingresar la localidad.';
    error = true;
    res.jsonp([{ error: error, msg: msg }]);
    return;
  }
  var id_zone = req.body.id_zone;

  //Articulo.
  var article = req.body.article;
  var id_article = article.id_article;
  var total_carga_marketing = article.total_carga_marketing;

  var qry = '';
  var qry_callback = '';
  req.getConnection(function(err, connection) {
    if (err) {
      msg = 'Error al cargar el valor del stock.';
      error = true;
      res.jsonp([{ error: error, msg: msg }]);
      return;
    }
    connection.beginTransaction(function(err) {
      if (err) {
        msg = 'Error al cargar el valor del stock.';
        error = true;
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      var parametros = [];
      //Stock Actual.
      qry = 'DROP TEMPORARY TABLE IF EXISTS tmp_stock_date; ';
      qry += 'CREATE TEMPORARY TABLE tmp_stock_date ';
      qry += 'SELECT ';
      qry += '  st.id_article, ';
      qry += '  MAX(st.stock_date) stock_date ';
      qry += 'FROM ';
      qry += '  stock st ';
      qry += 'WHERE ';
      qry += '  st.id_zone = ? ';
      qry += '  AND st.id_article = ? ';
      qry += 'GROUP BY st.id_article;';
      parametros.push(id_zone);
      parametros.push(id_article);

      //Se cargan el nuevo valor del stock solo si el valor del marketin es menor igual que el stock actual.
      qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_stock; ';
      qry += 'CREATE TEMPORARY TABLE tmp_stock ';
      qry += 'SELECT ';
      qry += '  ? id_zone, ';
      qry += '  a.id_article, ';
      qry += '  CURDATE() stock_date, ';
      qry += '  st.total - ? total, ';
      qry += '  st.total_marketing + ? total_marketing, ';
      qry += '  st.price ';
      qry += 'FROM ';
      qry += '  article a ';
      qry += '  JOIN tmp_stock_date tstd ON(tstd.id_article = a.id_article) ';
      qry += '  JOIN stock st ON(tstd.id_article = st.id_article AND tstd.stock_date = st.stock_date AND st.id_zone = ?) ';
      qry += 'WHERE ';
      qry += '  a.id_article = ? ';
      qry += '  AND st.total >= ?; ';
      parametros.push(id_zone);
      parametros.push(total_carga_marketing);
      parametros.push(total_carga_marketing);
      parametros.push(id_zone);
      parametros.push(id_article);
      parametros.push(total_carga_marketing);

      //Insercion del stock acual.
      qry += 'INSERT INTO stock ';
      qry += '  (id_zone, id_article, stock_date, total, total_marketing, price) ';
      qry += 'SELECT ';
      qry += '  st.id_zone, ';
      qry += '  st.id_article, ';
      qry += '  st.stock_date, ';
      qry += '  st.total, ';
      qry += '  st.total_marketing, ';
      qry += '  st.price ';
      qry += 'FROM ';
      qry += '  tmp_stock st ';
      qry += 'ON DUPLICATE KEY UPDATE ';
      qry += '  total = st.total, ';
      qry += '  total_marketing = st.total_marketing, ';
      qry += '  price = st.price ';
      var qry_callback = connection.query(qry, parametros, function(err, stock_order) {
        console.log(qry_callback.sql);
        if (err) {
          msg = 'Error al cargar el valor del stock.';
          error = true;
          return connection.rollback(function() {
            res.jsonp([{ error: error, msg: msg }]);
            return;
          });
        }
        connection.commit(function(err) {
          if (err) {
            msg = 'Error al cargar el valor del stock.';
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
};

/**
 * Carga del consumo propio que descontara del stock.
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.load_consumption = function(req, res) {
  var msg = 'TODO OK';
  var error = false;
  if(req.body.id_zone === undefined || req.body.id_zone === null){
    msg = 'Debe ingresar la localidad.';
    error = true;
    res.jsonp([{ error: error, msg: msg }]);
    return;
  }
  var id_zone = req.body.id_zone;

  //Articulo.
  var article = req.body.article;
  var id_article = article.id_article;
  var total_carga_consumption = article.total_carga_consumption;

  var qry = '';
  var qry_callback = '';
  req.getConnection(function(err, connection) {
    if (err) {
      msg = 'Error al cargar el valor del stock.';
      error = true;
      res.jsonp([{ error: error, msg: msg }]);
      return;
    }
    connection.beginTransaction(function(err) {
      if (err) {
        msg = 'Error al cargar el valor del stock.';
        error = true;
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      var parametros = [];
      //Stock Actual.
      qry = 'DROP TEMPORARY TABLE IF EXISTS tmp_stock_date; ';
      qry += 'CREATE TEMPORARY TABLE tmp_stock_date ';
      qry += 'SELECT ';
      qry += '  st.id_article, ';
      qry += '  MAX(st.stock_date) stock_date ';
      qry += 'FROM ';
      qry += '  stock st ';
      qry += 'WHERE ';
      qry += '  st.id_zone = ? ';
      qry += '  AND st.id_article = ? ';
      qry += 'GROUP BY st.id_article;';
      parametros.push(id_zone);
      parametros.push(id_article);

      //Se cargan el nuevo valor del stock solo si el valor del marketin es menor igual que el stock actual.
      qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_stock; ';
      qry += 'CREATE TEMPORARY TABLE tmp_stock ';
      qry += 'SELECT ';
      qry += '  ? id_zone, ';
      qry += '  a.id_article, ';
      qry += '  CURDATE() stock_date, ';
      qry += '  st.total - ? total, ';
      qry += '  st.total_consumption + ? total_consumption, ';
      qry += '  st.price ';
      qry += 'FROM ';
      qry += '  article a ';
      qry += '  JOIN tmp_stock_date tstd ON(tstd.id_article = a.id_article) ';
      qry += '  JOIN stock st ON(tstd.id_article = st.id_article AND tstd.stock_date = st.stock_date AND st.id_zone = ?) ';
      qry += 'WHERE ';
      qry += '  a.id_article = ? ';
      qry += '  AND st.total >= ?; ';
      parametros.push(id_zone);
      parametros.push(total_carga_consumption);
      parametros.push(total_carga_consumption);
      parametros.push(id_zone);
      parametros.push(id_article);
      parametros.push(total_carga_consumption);

      //Insercion del stock acual.
      qry += 'INSERT INTO stock ';
      qry += '  (id_zone, id_article, stock_date, total, total_consumption, price) ';
      qry += 'SELECT ';
      qry += '  st.id_zone, ';
      qry += '  st.id_article, ';
      qry += '  st.stock_date, ';
      qry += '  st.total, ';
      qry += '  st.total_consumption, ';
      qry += '  st.price ';
      qry += 'FROM ';
      qry += '  tmp_stock st ';
      qry += 'ON DUPLICATE KEY UPDATE ';
      qry += '  total = st.total, ';
      qry += '  total_consumption = st.total_consumption, ';
      qry += '  price = st.price ';
      var qry_callback = connection.query(qry, parametros, function(err, stock_order) {
        console.log(qry_callback.sql);
        if (err) {
          msg = 'Error al cargar el valor del stock.';
          error = true;
          return connection.rollback(function() {
            res.jsonp([{ error: error, msg: msg }]);
            return;
          });
        }
        connection.commit(function(err) {
          if (err) {
            msg = 'Error al cargar el valor del stock.';
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
};

/**
 * List of Current Stock.
 */
exports.list_stocks = function(req, res) {
  if(req.query.id_zone === undefined || req.query.id_zone === null){
    return res.status(400).send({
      message: 'Debe ingresar la localidad.'
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

    //Stock Actual.
    qry = 'DROP TEMPORARY TABLE IF EXISTS tmp_stock_date; ';
    qry += 'CREATE TEMPORARY TABLE tmp_stock_date ';
    qry += 'SELECT ';
    qry += '  st.id_article, ';
    qry += '  MAX(st.stock_date) stock_date ';
    qry += 'FROM ';
    qry += '  zone z ';
    qry += '  JOIN stock st USING(id_zone) ';
    qry += 'WHERE ';
    qry += '  z.id_zone = ? ';
    qry += 'GROUP BY st.id_article;';

    //Seleccion del stock actual.
    qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_stock; ';
    qry += 'CREATE TEMPORARY TABLE tmp_stock ';
    qry += 'SELECT ';
    qry += '  st.* ';
    qry += 'FROM ';
    qry += '  zone z ';
    qry += '  JOIN stock st USING(id_zone) ';
    qry += '  JOIN tmp_stock_date tstd ON(tstd.id_article = st.id_article AND tstd.stock_date = st.stock_date) ';
    qry += 'WHERE ';
    qry += '  z.id_zone = ? ';
    qry += '  AND st.total > 0;';
    qry_callback = connection.query(qry, [id_zone, id_zone], function(err, purchase_price) {
      console.log(qry_callback.sql);
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
        where += '  AND z.id_zone = ' + connection.escape(id_zone) + ' ';
      } else{
        where += 'WHERE ';
        where += '  z.id_zone = ' + connection.escape(id_zone) + ' ';
      }

      //GROUP BY.
      var group_by = 'GROUP BY a.id_article ';

      //ORDER BY.
      var order_by = mysql_helper.getOrderBy('a.name', req.query.sorting);

      //LIMIT.
      var rtdo_limit_pag = mysql_helper.getLimitAndPagination(page, count);
      var pagination = rtdo_limit_pag.pagination;
      var limit = rtdo_limit_pag.limit;

      var qry = '';
      qry += 'SELECT ';
      qry += '  COUNT(*) total_count, ';
      qry += '  SUM(st.price * st.total) total_valued ';
      qry += 'FROM ';
      qry += '  article a ';
      qry += '  JOIN measurement_unit mu USING(id_measurement_unit) ';
      qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
      qry += '  JOIN subgroup sg USING(id_subgroup) ';
      qry += '  JOIN grupo g USING(id_group) ';
      qry += '  JOIN article_location al USING(id_article) ';
      qry += '  JOIN zone z USING(id_location) ';
      qry += '  JOIN tmp_stock st USING(id_article) ';
      qry += '  LEFT JOIN brand b USING(id_brand) ';
      qry += where;
      qry += '; ';
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
      qry += '  st.id_stock, ';
      qry += '  st.stock_date, ';
      qry += '  st.total, ';
      qry += '  st.total_purchase_order, ';
      qry += '  st.total_purchase_order_impulsive, ';
      qry += '  st.total_delivery_order, ';
      qry += '  st.total_waste, ';
      qry += '  st.total_marketing, ';
      qry += '  st.total_gift, ';
      qry += '  st.total_consumption, ';
      qry += '  st.price, ';
      qry += '  SUM(st.price * st.total) total_valued ';
      qry += 'FROM ';
      qry += '  article a ';
      qry += '  JOIN measurement_unit mu USING(id_measurement_unit) ';
      qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
      qry += '  JOIN subgroup sg USING(id_subgroup) ';
      qry += '  JOIN grupo g USING(id_group) ';
      qry += '  JOIN article_location al USING(id_article) ';
      qry += '  JOIN zone z USING(id_location) ';
      qry += '  JOIN tmp_stock st USING(id_article) ';
      qry += '  LEFT JOIN brand b USING(id_brand) ';
      qry += where;
      qry += group_by;
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
  });
};
