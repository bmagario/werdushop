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
 * Metodo encargado de recorrer todos los articulos
 * de los cuales se van a cargar los precios.
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.load_price = function(req, res) {
  var articulos_errores = [];
  var msg = 'TODO OK';
  var error = false;
  var articles = req.body.articles;
  var id_location = parseInt(req.body.id_location);

  //Recorro todos los articulos enviados.
  var price_array_insert = [];
  async.eachSeries(articles, function(article, callback) {
    var price_array = [
      id_location,
      article.id_article,
      article.purchase_price,
      article.price,
      article.coeficient,
      article.offer,
      article.season,
      article.quality,
      article.impulse
    ];
    price_array_insert.push(price_array);
    callback();
  }, function(err) {
    if(err) {
      msg = 'Error al cargar los precios.';
      error = true;
      res.jsonp([{ articulos_errores: articulos_errores, error: error, msg: msg }]);
      return;
    }
    if(price_array_insert.length > 0){
      req.getConnection(function(err, connection) {
        if (err) {
          msg = 'Error al cargar los precios.';
          error = true;
          res.jsonp([{ articulos_errores: articulos_errores, error: error, msg: msg }]);
          return;
        }
        var qry = 'INSERT INTO price (id_location, id_article, purchase_price, price, coeficient, offer, season, quality, impulse) VALUES ? ';
        connection.query(qry, [price_array_insert], function(err, result) {
          if (err) {
            msg = 'Error al cargar los precios.';
            error = true;
            res.jsonp([{ articulos_errores: articulos_errores, error: error, msg: msg }]);
            return;
          }
          res.jsonp([{ articulos_errores: articulos_errores, error: error, msg: msg }]);
        });
      });
    } else{
      msg = 'Error al cargar los precios.';
      error = true;
      res.jsonp([{ articulos_errores: articulos_errores, error: error, msg: msg }]);
      return;
    }
  });
};

/**
 * Update a Article
 */
exports.enable_article = function(req, res) {
  var articles = req.body.articles;
  var type = req.body.type;
  var id_location = parseInt(req.body.id_location);
  var msg = 'TODO OK';
  var error = false;

  var qry = '';
  var qry_callback ;
  req.getConnection(function(err, connection) {
    if (err) {
      msg = 'Error al deshabilitar los articulos.';
      error = true;
      res.jsonp([{ error: error, msg: msg }]);
      return;
    }
    if(type === true){
      var articulos_insert = [];
      for (var i = 0, len = articles.length; i < len; i++) {
        articulos_insert.push([ id_location, articles[i].id_article ]);
      }
      qry = 'INSERT IGNORE INTO article_location (id_location, id_article) VALUES ?; ';
      qry_callback = connection.query(qry, [articulos_insert], function(err, result) {
        console.log(qry_callback.sql);
        if (err) {
          msg = 'Error al deshabilitar los articulos.';
          error = true;
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }
        res.jsonp([{ error: error, msg: msg }]);
      });
    } else{
      var articulos = [];
      for (var j = 0, len2 = articles.length; j < len2; j++) {
        articulos.push(articles[j].id_article);
      }
      qry = 'DELETE FROM article_location WHERE id_location = ? AND id_article IN (?); ';
      connection.query(qry, [id_location, articulos], function(err, result) {
        if (err) {
          msg = 'Error al deshabilitar los articulos.';
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
 * List of Articles
 */
exports.list_prices = function(req, res) {
  //Si se envio filtro por subgrupo.
  if(req.query.id_location === undefined || req.query.id_location === null){
    return res.status(400).send({
      message: 'Debe ingresar la localidad.'
    });
  }

  var qry = '';
  var qry_callback = '';
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    //Por el momento se semi-harcodea la zona;
    var id_location = parseInt(req.query.id_location);
    /*SELECT t1.*
    FROM TrainTable t1 LEFT JOIN TrainTable t2
    ON (t1.Train = t2.Train AND t1.Time < t2.Time)
    WHERE t2.Time IS NULL;*/
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
    qry += 'GROUP BY p.id_article;';

    qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_price; ';
    qry += 'CREATE TEMPORARY TABLE tmp_price ';
    qry += 'SELECT ';
    qry += '  p.* ';
    qry += 'FROM ';
    qry += '  price p ';
    qry += '  JOIN tmp_price_date tpd ON(tpd.id_article = p.id_article AND tpd.created = p.created) ';
    qry += 'WHERE ';
    qry += '  p.id_location = ?;';

    //Purchase Price.
    qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_purchase_date; ';
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
    qry += '  AND p.price > 0 ';
    qry += 'GROUP BY p.id_article;';

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
    qry += '  z.id_location = ?;';

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
    qry += '  AND s.price > 0 ';
    qry += 'GROUP BY s.id_article;';

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
    qry += '  so.id_location = ?;';

    //Temporal de Precios de Compra/Relevamiento.
    qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_purchase_price; ';
    qry += 'CREATE TEMPORARY TABLE tmp_purchase_price ';
    qry += 'SELECT ';
    qry += '  a.id_article, ';
    qry += '  CASE ';
    qry += '    WHEN tpp.id_article IS NOT NULL AND ts.id_article IS NOT NULL THEN IF(tpp.created >= ts.created, tpp.price, ts.price) ';
    qry += '    WHEN tpp.id_article IS NOT NULL AND ts.id_article IS NULL THEN tpp.price ';
    qry += '    WHEN tpp.id_article IS NULL AND ts.id_article IS NOT NULL THEN ts.price ';
    qry += '    ELSE NULL ';
    qry += '  END purchase_price, ';
    qry += '  CASE ';
    qry += '    WHEN tpp.id_article IS NOT NULL AND ts.id_article IS NOT NULL THEN IF(tpp.created >= ts.created, tpp.created, ts.created) ';
    qry += '    WHEN tpp.id_article IS NOT NULL AND ts.id_article IS NULL THEN tpp.created ';
    qry += '    WHEN tpp.id_article IS NULL AND ts.id_article IS NOT NULL THEN ts.created ';
    qry += '    ELSE NULL ';
    qry += '  END created ';
    qry += 'FROM ';
    qry += '  article a ';
    qry += '  LEFT JOIN tmp_purchase tpp ON(a.id_article = tpp.id_article) ';
    qry += '  LEFT JOIN tmp_survey ts ON(a.id_article = ts.id_article);';
    qry_callback = connection.query(qry, [id_location, id_location, id_location, id_location, id_location, id_location], function(err, purchase_price) {
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

      //ORDER BY.
      var order_by = mysql_helper.getOrderBy('a.name', req.query.sorting);

      //LIMIT.
      var rtdo_limit_pag = mysql_helper.getLimitAndPagination(page, count);
      var pagination = rtdo_limit_pag.pagination;
      var limit = rtdo_limit_pag.limit;

      var qry = '';
      qry += 'SELECT ';
      qry += '  COUNT(*) total_count ';
      qry += 'FROM ';
      qry += '  article a ';
      qry += '  JOIN measurement_unit mu USING(id_measurement_unit) ';
      qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
      qry += '  JOIN subgroup sg USING(id_subgroup) ';
      qry += '  JOIN grupo g USING(id_group) ';
      qry += '  LEFT JOIN brand b USING(id_brand) ';
      qry += '  JOIN tmp_purchase_price pp ON(pp.id_article = a.id_article) ';
      qry += '  LEFT JOIN article_location al ON(al.id_location = ? AND al.id_article = a.id_article) ';
      qry += '  LEFT JOIN tmp_price p ON(a.id_article = p.id_article) ';
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
      qry += '  g.name group_name, ';
      qry += '  b.name brand_name, ';
      qry += '  pp.purchase_price, ';
      qry += '  p.price, ';
      qry += '  p.coeficient, ';
      qry += '  p.offer, ';
      qry += '  p.season, ';
      qry += '  p.quality, ';
      qry += '  p.impulse, ';
      qry += '  IF(pp.created > p.created, "precio_cambiado", "") precio_cambiado ';
      qry += 'FROM ';
      qry += '  article a ';
      qry += '  JOIN measurement_unit mu USING(id_measurement_unit) ';
      qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
      qry += '  JOIN subgroup sg USING(id_subgroup) ';
      qry += '  JOIN grupo g USING(id_group) ';
      qry += '  LEFT JOIN brand b USING(id_brand) ';
      qry += '  JOIN tmp_purchase_price pp ON(pp.id_article = a.id_article) ';
      qry += '  LEFT JOIN article_location al ON(al.id_location = ? AND al.id_article = a.id_article) ';
      qry += '  LEFT JOIN tmp_price p ON(a.id_article = p.id_article) ';
      qry += where;
      qry += order_by;
      qry += limit;
      qry_callback = connection.query(qry, [id_location, id_location], function(err, results) {
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
        var articles = results[1];
        var result = mysql_helper.getResult(articles, total_count, pagination);
        res.jsonp(result);
      });
    });
  });
};

/**
 * Metodo encargado de recorrer todos los articulos
 * de los cuales se van a cargar los precios.
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.load_price_complex = function(req, res) {
  var articulos_errores = [];
  var msg = 'TODO OK';
  var error = false;
  var complex_articles = req.body.complex_articles;
  var id_location = parseInt(req.body.id_location);

  //Recorro todos los articulos enviados.
  var price_array_insert = [];
  async.eachSeries(complex_articles, function(complex_article, callback) {
    var price_array = [
      id_location,
      complex_article.id_complex_article,
      complex_article.purchase_price,
      complex_article.price,
      complex_article.coeficient
    ];
    price_array_insert.push(price_array);
    callback();
  }, function(err) {
    if(err) {
      msg = 'Error al cargar los precios.';
      error = true;
      res.jsonp([{ articulos_errores: articulos_errores, error: error, msg: msg }]);
      return;
    }
    if(price_array_insert.length > 0){
      req.getConnection(function(err, connection) {
        if (err) {
          msg = 'Error al cargar los precios.';
          error = true;
          res.jsonp([{ articulos_errores: articulos_errores, error: error, msg: msg }]);
          return;
        }
        var qry = 'INSERT INTO price_complex_article (id_location, id_complex_article, purchase_price, price, coeficient) VALUES ? ';
        connection.query(qry, [price_array_insert], function(err, result) {
          if (err) {
            msg = 'Error al cargar los precios.';
            error = true;
            res.jsonp([{ articulos_errores: articulos_errores, error: error, msg: msg }]);
            return;
          }
          res.jsonp([{ articulos_errores: articulos_errores, error: error, msg: msg }]);
        });
      });
    } else{
      msg = 'Error al cargar los precios.';
      error = true;
      res.jsonp([{ articulos_errores: articulos_errores, error: error, msg: msg }]);
      return;
    }
  });
};

/**
 * Update a Article
 */
exports.enable_complex_article = function(req, res) {
  var complex_articles = req.body.complex_articles;
  var type = req.body.type;
  var id_location = parseInt(req.body.id_location);
  var msg = 'TODO OK';
  var error = false;

  var qry = '';
  var qry_callback ;
  req.getConnection(function(err, connection) {
    if (err) {
      msg = 'Error al deshabilitar los articulos complejos.';
      error = true;
      res.jsonp([{ error: error, msg: msg }]);
      return;
    }
    if(type === true){
      var complex_articulos_insert = [];
      for (var i = 0, len = complex_articles.length; i < len; i++) {
        complex_articulos_insert.push([ id_location, complex_articles[i].id_complex_article ]);
      }
      qry = 'INSERT IGNORE INTO complex_article_location (id_location, id_complex_article) VALUES ? ';
      qry_callback = connection.query(qry, [complex_articulos_insert], function(err, result) {
        console.log(qry_callback.sql);
        if (err) {
          msg = 'Error al deshabilitar los articulos complejos.';
          error = true;
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }
        res.jsonp([{ error: error, msg: msg }]);
      });
    } else{
      var complex_articulos = [];
      for (var j = 0, len2 = complex_articles.length; j < len2; j++) {
        complex_articulos.push(complex_articles[j].id_complex_article);
      }
      qry = 'DELETE FROM complex_article_location WHERE id_location = ? AND id_complex_article IN (?) ';
      qry_callback = connection.query(qry, [id_location, complex_articulos], function(err, result) {
        console.log(qry_callback.sql);
        if (err) {
          msg = 'Error al deshabilitar los articulos complejos.';
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
 * List of Complex Articles
 */
exports.list_prices_complex = function(req, res) {
  //Si se envio filtro por subgrupo.
  if(req.query.id_location === undefined || req.query.id_location === null){
    return res.status(400).send({
      message: 'Debe ingresar la localidad.'
    });
  }

  var qry = '';
  var qry_callback = '';
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    var id_location = parseInt(req.query.id_location);

    //Price.
    qry = 'DROP TEMPORARY TABLE IF EXISTS tmp_price_date; ';
    qry += 'CREATE TEMPORARY TABLE tmp_price_date ';
    qry += 'SELECT ';
    qry += '  p.id_complex_article, ';
    qry += '  MAX(p.created) created ';
    qry += 'FROM ';
    qry += '  price_complex_article p ';
    qry += 'WHERE ';
    qry += '  p.id_location = ? ';
    qry += 'GROUP BY p.id_complex_article;';

    qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_price; ';
    qry += 'CREATE TEMPORARY TABLE tmp_price ';
    qry += 'SELECT ';
    qry += '  p.* ';
    qry += 'FROM ';
    qry += '  price_complex_article p ';
    qry += '  JOIN tmp_price_date tpd ON(tpd.id_complex_article = p.id_complex_article AND tpd.created = p.created) ';
    qry += 'WHERE ';
    qry += '  p.id_location = ?;';

    //Purchase Price.
    qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_purchase_date; ';
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
    qry += '  AND p.price > 0 ';
    qry += 'GROUP BY p.id_article;';

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
    qry += '  z.id_location = ?;';

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
    qry += '  AND s.price > 0 ';
    qry += 'GROUP BY s.id_article;';

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
    qry += '  so.id_location = ?;';

    //Temporal de Precios de Compra/Relevamiento.
    qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_purchase_price; ';
    qry += 'CREATE TEMPORARY TABLE tmp_purchase_price ';
    qry += 'SELECT ';
    qry += '  a.id_article, ';
    qry += '  CASE ';
    qry += '    WHEN tpp.id_article IS NOT NULL AND ts.id_article IS NOT NULL THEN IF(tpp.created >= ts.created, tpp.price, ts.price) ';
    qry += '    WHEN tpp.id_article IS NOT NULL AND ts.id_article IS NULL THEN tpp.price ';
    qry += '    WHEN tpp.id_article IS NULL AND ts.id_article IS NOT NULL THEN ts.price ';
    qry += '    ELSE NULL ';
    qry += '  END purchase_price, ';
    qry += '  CASE ';
    qry += '    WHEN tpp.id_article IS NOT NULL AND ts.id_article IS NOT NULL THEN IF(tpp.created >= ts.created, tpp.created, ts.created) ';
    qry += '    WHEN tpp.id_article IS NOT NULL AND ts.id_article IS NULL THEN tpp.created ';
    qry += '    WHEN tpp.id_article IS NULL AND ts.id_article IS NOT NULL THEN ts.created ';
    qry += '    ELSE NULL ';
    qry += '  END created ';
    qry += 'FROM ';
    qry += '  article a ';
    qry += '  LEFT JOIN tmp_purchase tpp ON(a.id_article = tpp.id_article) ';
    qry += '  LEFT JOIN tmp_survey ts ON(a.id_article = ts.id_article);';
    qry_callback = connection.query(qry, [id_location, id_location, id_location, id_location, id_location, id_location], function(err, purchase_price) {
      /*console.log(qry_callback.sql);*/
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
      var order_by = mysql_helper.getOrderBy('a.name', req.query.sorting);

      //LIMIT.
      var rtdo_limit_pag = mysql_helper.getLimitAndPagination(page, count);
      var pagination = rtdo_limit_pag.pagination;
      var limit = rtdo_limit_pag.limit;

      var qry = '';
      qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_complex_articles; ';
      qry += 'CREATE TEMPORARY TABLE tmp_complex_articles ';
      qry += 'SELECT ';
      qry += '  a.*, ';
      qry += '  IF(cal.id_complex_article IS NULL, 0, 1) enabled, ';
      qry += '  sg.name subgroup_name, ';
      qry += '  CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0), "", LPAD(a.code, 8, 0)) full_code, ';
      qry += '  g.name group_name, ';
      qry += '  0 purchase_price, ';
      qry += '  p.coeficient, ';
      qry += '  p.price, ';
      qry += '  p.created price_created, ';
      qry += '  "" precio_cambiado ';
      qry += 'FROM ';
      qry += '  complex_article a ';
      qry += '  JOIN subgroup sg USING(id_subgroup) ';
      qry += '  JOIN grupo g USING(id_group) ';
      qry += '  LEFT JOIN complex_article_location cal ON(cal.id_location = ? AND cal.id_complex_article = a.id_complex_article) ';
      qry += '  LEFT JOIN tmp_price p ON(a.id_complex_article = p.id_complex_article) ';
      qry += where;
      qry_callback = connection.query(qry, [id_location], function(err, result) {
        /*console.log(qry_callback.sql);*/
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        qry = 'SELECT COUNT(*) total_count FROM tmp_complex_articles; ';
        qry += 'SELECT * FROM tmp_complex_articles a ';
        qry += order_by;
        qry += limit;
        qry += 'SELECT ';
        qry += '  tca.id_complex_article, ';
        qry += '  cad.scale_complex, ';
        qry += '  cad.equivalence_complex, ';
        qry += '  a.*, ';
        qry += '  mu.name measurement_unit_name, ';
        qry += '  mu.abbreviation measurement_unit_abbreviation, ';
        qry += '  mu.abbreviation_plural measurement_unit_abbreviation_plural, ';
        qry += '  mu.name measurement_unit_name_complex, ';
        qry += '  muc.abbreviation measurement_unit_abbreviation_complex, ';
        qry += '  muc.abbreviation measurement_unit_abbreviation_plural_complex, ';
        qry += '  mue.name measurement_unit_equivalence_name, ';
        qry += '  mue.abbreviation measurement_unit_equivalence_abbreviation, ';
        qry += '  mue.abbreviation_plural measurement_unit_equivalence_abbreviation_plural, ';
        qry += '  sg.name subgroup_name, ';
        qry += '  CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0), "", LPAD(a.code, 3, 0)) full_code, ';
        qry += '  g.name group_name, ';
        qry += '  b.name brand_name, ';
        qry += '  pp.purchase_price, ';
        qry += '  pp.created purchase_created ';
        qry += 'FROM ';
        qry += '  tmp_complex_articles tca ';
        qry += '  JOIN complex_article_detail cad USING(id_complex_article) ';
        qry += '  JOIN article a USING(id_article) ';
        qry += '  JOIN measurement_unit mu ON(mu.id_measurement_unit = a.id_measurement_unit) ';
        qry += '  JOIN measurement_unit muc ON(muc.id_measurement_unit = cad.id_measurement_unit) ';
        qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
        qry += '  JOIN subgroup sg ON(sg.id_subgroup = a.id_subgroup) ';
        qry += '  JOIN grupo g USING(id_group) ';
        qry += '  LEFT JOIN brand b USING(id_brand) ';
        qry += '  JOIN tmp_purchase_price pp ON(pp.id_article = a.id_article) ';
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
          var complex_articles = results[1];
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
              return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
              });
            }

            var result = mysql_helper.getResult(complex_articles, total_count, pagination);
            result.articulos = articulos;
            res.jsonp(result);
          });
        });
      });
    });
  });
};
