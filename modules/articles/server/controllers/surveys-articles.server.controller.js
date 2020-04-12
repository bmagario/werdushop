'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  async = require('async'),
  globals = require(path.resolve('.','./config/globals')),
  shared = require(path.resolve('.','./config/shared')),
  mysql_helper = require(path.resolve('.','./config/mysql_helper')),
  multer = require('multer'),
  config = require(path.resolve('./config/config')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');


exports.load_survey = function(req, res) {
  var articulos_errores = [];
  var msg = 'TODO OK';
  var error = false;
  var id_survey_order = req.body.id_survey_order;
  var articles = req.body.articles;

  //Recorro todos los articulos enviados.
  var survey_array_insert = [];
  async.eachSeries(articles, function(article, callback) {
    //Se cheque por la validez de los campos del articulo enviado.
    var codigo_control = shared.controlCargaOrdenRelevamiento(article);
    if(codigo_control === 0){
      callback('Existen artículos con valores inconsistentes.');
      return;
    }

    var survey_array = [
      id_survey_order,
      article.id_article,
      article.total_surveyed,
      article.total_price,
      article.price
    ];
    survey_array_insert.push(survey_array);
    callback();
  }, function(err) {
    if(err) {
      msg = err;
      error = true;
      res.jsonp([{ articulos_errores: articulos_errores, error: error, msg: msg }]);
      return;
    }
    if(survey_array_insert.length > 0){
      req.getConnection(function(err, connection) {
        if (err) {
          msg = 'Error al cargar el relevamiento.';
          error = true;
          res.jsonp([{ articulos_errores: articulos_errores, error: error, msg: msg }]);
          return;
        }
        var qry = 'REPLACE INTO survey (id_survey_order, id_article, total_surveyed, total_price, price) VALUES ? ';
        connection.query(qry, [survey_array_insert], function(err, result) {
          if (err) {
            msg = 'Error al cargar el relevamiento.';
            error = true;
            res.jsonp([{ articulos_errores: articulos_errores, error: error, msg: msg }]);
            return;
          }
          res.jsonp([{ articulos_errores: articulos_errores, error: error, msg: msg }]);
        });
      });
    } else{
      msg = 'Error al cargar el relevamiento.';
      error = true;
      res.jsonp([{ articulos_errores: articulos_errores, error: error, msg: msg }]);
      return;
    }
  });
};

/**
 * List of Articles
 */
exports.list_surveys = function(req, res) {
  //Si se envio filtro por subgrupo.
  if(req.query.id_location === undefined || req.query.id_location === null){
    return res.status(400).send({
      message: 'Debe ingresar la localidad.'
    });
  }

  var qry = '';
  var qry_callback;
  var id_location = parseInt(req.query.id_location);
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    qry = 'SELECT id_survey_order, number FROM survey_order WHERE id_location = ? AND id_status = ? ORDER BY created LIMIT 1 ';
    qry_callback = connection.query(qry, [id_location, globals.RELEVAMIENTO_ACTIVO], function(err, survey_order) {
      /*console.log(qry_callback.sql);*/
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      if(!survey_order.length){
        var result = {};
        result.articles = [];
        result.id_survey_order = null;
        result.survey_order_number = null;
        res.jsonp(result);
        return;
      }
      var id_survey_order = survey_order[0].id_survey_order;
      var survey_order_number = survey_order[0].number;

      var count = req.query.count || 5;
      var page = req.query.page || 1;

      //WHERE.
      var where = mysql_helper.getWhereFilterArticles(connection, req.query.filter);
      if(where !== ''){
        where += 'AND s.id_survey_order = ' + connection.escape(id_survey_order) + ' ';
      } else{
        where += 'WHERE ';
        where += '    s.id_survey_order = ' + connection.escape(id_survey_order) + ' ';
      }

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
      qry += '  JOIN survey s USING(id_article) ';
      qry += '  LEFT JOIN brand b USING(id_brand) ';
      qry += '  LEFT JOIN article_location al ON(al.id_location = ? AND al.id_article = a.id_article) ';
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
      qry += '  g.name group_name, ';
      qry += '  b.name brand_name, ';
      qry += '  s.total_surveyed, ';
      qry += '  s.total_price, ';
      qry += '  s.price ';
      qry += 'FROM ';
      qry += '  article a ';
      qry += '  JOIN measurement_unit mu USING(id_measurement_unit) ';
      qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
      qry += '  JOIN subgroup sg USING(id_subgroup) ';
      qry += '  JOIN grupo g USING(id_group) ';
      qry += '  JOIN survey s USING(id_article) ';
      qry += '  LEFT JOIN brand b USING(id_brand) ';
      qry += '  LEFT JOIN article_location al ON(al.id_location = ? AND al.id_article = a.id_article) ';
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

        result.id_survey_order = id_survey_order;
        result.survey_order_number = survey_order_number;

        res.jsonp(result);
      });
    });
  });
};

exports.add_article = function(req, res){
  var id_survey_order = req.body.id_survey_order;
  var id_article = req.body.id_article;
  var id_location = req.body.id_location;

  var msg = 'TODO OK';
  var error = false;
  var qry = '';
  var qry_callback;
  req.getConnection(function(err, connection) {
    if (err) {
      msg = 'Error al cargar el relevamiento.';
      error = true;
      res.jsonp([{ error: error, msg: msg }]);
      return;
    }
    if(id_survey_order === undefined || id_survey_order === null){
      qry = 'SELECT MAX(number) number FROM survey_order WHERE id_location = ? ';
      connection.query(qry, [id_location], function(err, survey_order) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        if(!survey_order.length){
          return res.status(400).send({
            message: 'No se pudo crear Orden de Relevamiento.'
          });
        }
        var number = parseInt(survey_order[0].number) + 1;
        qry = 'INSERT INTO survey_order SET ? ';
        connection.query(qry, { id_location: id_location, number: number }, function(err, result) {
          if (err) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          }
          id_survey_order = result.insertId;
          var survey = {
            id_survey_order: id_survey_order,
            id_article: id_article
          };
          qry = 'INSERT INTO survey SET ? ';
          connection.query(qry, survey, function(err, result) {
            if (err) {
              msg = 'Error al insertar artículo en la orden de relevamiento.';
              error = true;
              res.jsonp([{ error: error, msg: msg }]);
              return;
            }
            res.jsonp([{ error: error, msg: msg }]);
          });
        });
      });
    } else{
      var survey = {
        id_survey_order: id_survey_order,
        id_article: id_article
      };
      qry = 'INSERT IGNORE INTO survey SET ? ';
      qry_callback = connection.query(qry, survey, function(err, result) {
        console.log(qry_callback.sql);
        if (err) {
          msg = 'Error al insertar artículo en la orden de relevamiento.';
          error = true;
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }
        res.jsonp([{ error: error, msg: msg }]);
      });
    }
  });
};

exports.close_survey_order = function(req, res){
  var id_survey_order = req.body.id_survey_order;
  var id_location = req.body.id_location;

  var msg = 'TODO OK';
  var error = false;
  if(id_survey_order === undefined || id_survey_order === null){
    msg = 'Error al cerrar la orden de relevamiento.';
    error = true;
    res.jsonp([{ error: error, msg: msg }]);
    return;
  }

  var qry = '';
  req.getConnection(function(err, connection) {
    if (err) {
      msg = 'Error al cerrar la orden de relevamiento.';
      error = true;
      res.jsonp([{ error: error, msg: msg }]);
      return;
    }
    connection.beginTransaction(function(err) {
      if (err) {
        msg = 'Error al cerrar la orden de relevamiento.';
        error = true;
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

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
      qry += '  z.id_location = ? ';
      qry += 'GROUP BY st.id_article;';

      //Actualizo el precio del stock actual.
      qry += 'UPDATE ';
      qry += '  zone z ';
      qry += '  JOIN stock st USING(id_zone) ';
      qry += '  JOIN tmp_stock_date tstd USING(id_article, stock_date) ';
      qry += '  JOIN survey_order so USING(id_location) ';
      qry += '  JOIN survey s ON(s.id_survey_order = so.id_survey_order AND s.id_article = st.id_article) ';
      qry += 'SET ';
      qry += '  st.price = (s.total_price/s.total_surveyed) ';
      qry += 'WHERE ';
      qry += '  z.id_location = ? ';
      qry += '  AND so.id_survey_order = ? ';
      qry += '  AND s.price > 0 ';
      var qry_callback = connection.query(qry, [id_location, id_location, id_survey_order], function(err, stock_order) {
        console.log(qry_callback.sql);
        if (err) {
          msg = 'Error al cerrar la orden de relevamiento.';
          error = true;
          return connection.rollback(function() {
            res.jsonp([{ error: error, msg: msg }]);
            return;
          });
        }
        qry = 'UPDATE survey_order SET id_status = ?, modified = NOW() WHERE id_survey_order = ? ';
        connection.query(qry, [globals.RELEVAMIENTO_FINALIZADO, id_survey_order], function(err, survey_order) {
          if (err) {
            msg = 'Error al cerrar la orden de relevamiento.';
            error = true;
            return connection.rollback(function() {
              res.jsonp([{ error: error, msg: msg }]);
              return;
            });
          }
          connection.commit(function(err) {
            if (err) {
              msg = 'Error al cerrar la orden de relevamiento.';
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
};
