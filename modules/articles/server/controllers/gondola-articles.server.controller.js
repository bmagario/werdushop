'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  async = require('async'),
  globals = require(path.resolve('.','./config/globals')),
  multer = require('multer'),
  config = require(path.resolve('./config/config')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

/*
* Muestra un Articulo de la Góndola
*/
exports.read_gondola = function(req, res) {
 // convert mongoose document to JSON
  var article = req.article ? req.article : {};
  res.jsonp(req.article);
};

/**
 * Lista la Gondola de Articulos
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
    qry += '  a.*, ';
    qry += '  mu.name measurement_unit_name, ';
    qry += '  mu.abbreviation measurement_unit_abbreviation, ';
    qry += '  mu.abbreviation_plural measurement_unit_abbreviation_plural, ';
    qry += '  mue.name measurement_unit_equivalence_name, ';
    qry += '  mue.abbreviation measurement_unit_equivalence_abbreviation, ';
    qry += '  mue.abbreviation_plural measurement_unit_equivalence_abbreviation_plural, ';
    qry += '  sg.name subgroup_name, ';
    qry += '  CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0), "", LPAD(a.code, 3, 0)) full_code, ';
    qry += '  g.name group_name, ';
    qry += '  b.name brand_name ';
    qry += 'FROM ';
    qry += '  article a ';
    qry += '  JOIN measurement_unit mu USING(id_measurement_unit) ';
    qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
    qry += '  JOIN subgroup sg USING(id_subgroup) ';
    qry += '  JOIN grupo g USING(id_group) ';
    qry += '  LEFT JOIN brand b USING(id_brand) ';
    qry += 'ORDER BY a.name;';
    connection.query(qry, [], function(err, articles) {
      if (err) {
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      }
      res.jsonp(articles);
    });
  });
};

exports.list_gondola = function(req, res) {
  console.log(req.user);
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    }
    var parametros = [];
    var qry = '';

    qry += 'SELECT ';
    qry += '  a.*, ';
    qry += '  ? tipo, ';
    qry += '  mu.name measurement_unit_name, ';
    qry += '  mu.abbreviation measurement_unit_abbreviation, ';
    qry += '  mu.abbreviation_plural measurement_unit_abbreviation_plural, ';
    qry += '  mue.name measurement_unit_equivalence_name, ';
    qry += '  mue.abbreviation measurement_unit_equivalence_abbreviation, ';
    qry += '  mue.abbreviation_plural measurement_unit_equivalence_abbreviation_plural, ';
    qry += '  sg.name subgroup_name, ';
    qry += '  g.name group_name, ';
    qry += '  b.name brand_name ';
    qry += 'FROM ';
    qry += '  article a ';
    qry += '  JOIN measurement_unit mu USING(id_measurement_unit) ';
    qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
    qry += '  JOIN subgroup sg USING(id_subgroup) ';
    qry += '  JOIN grupo g USING(id_group) ';
    qry += '  LEFT JOIN brand b USING(id_brand) ';
    qry += 'ORDER BY a.name;';
    parametros.push(globals.ARTICULO_SIMPLE);

    qry += 'SELECT ';
    qry += '  ac.*, ';
    qry += '  ? tipo, ';
    qry += '  sg.name subgroup_name, ';
    qry += '  g.name group_name, ';
    qry += 'FROM ';
    qry += '  complex_article ac ';
    qry += '  JOIN subgroup sg USING(id_subgroup) ';
    qry += '  JOIN grupo g USING(id_group) ';
    qry += 'WHERE ';
    qry += '  (ac.effective_date IS NULL OR c.effective_date >= NOW()) ';
    qry += 'ORDER BY ac.name;';
    parametros.push(globals.ARTICULO_COMPLEJO);

    connection.query(qry, parametros, function(err, articles) {
      if (err) {
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      }
      res.jsonp(articles[0].concat(articles[1]));
    });
  });
};

/**
* Paginate List articles
**/
exports.list_articles_gondola = function(req, res, next){
  //Retornar los artículos habilitados para la localidad y zona, que tengan precio cargado,
  //que correspondan a un determinado grupo (Futas, verduras, etc)

  //Filtro de localidad.
  req.query.location = globals.LOCATIONS.BAHIA_BLANCA;

  //Filtro de la localidad.
  if(req.query.location === undefined || req.query.location === null){
    return res.status(400).send({ message: 'Debe ingresar la localidad.' });
  }

  var filter_name = req.query.name;
  if(req.query.name === undefined || req.query.name === null || req.query.name === ''){
    filter_name = false;
  }

  var qry = '';
  var qry_callback;
  var parametros = [];

  req.getConnection(function(err, connection) {

    if (err) {
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    }
    //Por el momento se semi-harcodea la zona;
    var id_location = req.query.location;

    //último fecha del última carga de precios de los articulos simples.
    qry = 'DROP TEMPORARY TABLE IF EXISTS tmp_price_date; ';
    qry += 'CREATE TEMPORARY TABLE tmp_price_date ';
    qry += 'SELECT ';
    qry += '  p.id_article, ';
    qry += '  MAX(p.created) created ';
    qry += 'FROM ';
    qry += '  price p ';
    qry += 'WHERE ';
    qry += '  p.id_location = ? ';
    qry += '  AND p.price > 0 ';
    qry += 'GROUP BY p.id_article;';
    parametros.push(id_location);

    //Obtiene los precios correspondientes a las fechas de la tabla anterior
    qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_price; ';
    qry += 'CREATE TEMPORARY TABLE tmp_price ';
    qry += 'SELECT ';
    qry += '  p.* ';
    qry += 'FROM ';
    qry += '  price p ';
    qry += '  JOIN tmp_price_date tpd ON(tpd.id_article = p.id_article AND tpd.created = p.created) ';
    qry += 'WHERE ';
    qry += '  p.id_location = ?; ';
    parametros.push(id_location);

    //último fecha del última carga de precios de los articulos complejos.
    qry += 'DROP TEMPORARY TABLE if EXISTS tmp_price_complex_date; ';
    qry += 'CREATE TEMPORARY TABLE tmp_price_complex_date ';
    qry += 'SELECT ';
    qry += '  pca.id_complex_article, ';
    qry += '  MAX(pca.created) created ';
    qry += 'FROM ';
    qry += '  price_complex_article pca ';
    qry += 'WHERE ';
    qry += '  pca.id_location = ? ';
    qry += '  AND pca.price > 0 ';
    qry += 'GROUP BY pca.id_complex_article;';
    parametros.push(id_location);

    //Obtiene los precios correspondientes a las fechas de la tabla anterior
    qry += 'DROP TEMPORARY TABLE if EXISTS tmp_price_complex; ';
    qry += 'CREATE TEMPORARY TABLE tmp_price_complex ';
    qry += 'SELECT ';
    qry += '  pca.* ';
    qry += 'FROM ';
    qry += '  price_complex_article pca ';
    qry += '  JOIN tmp_price_complex_date tpd USING(id_complex_article, created) ';
    qry += 'WHERE ';
    qry += '  pca.id_location = ?; ';
    parametros.push(id_location);

    qry_callback = connection.query(qry, parametros, function(err, purchase_price) {
      console.log(qry_callback.sql);
      if (err) {
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      }

      parametros = [];

      // Articulos simples.
      qry = '';
      qry += 'SELECT ';
      qry += '  a.*, ';
      qry += '  ? tipo, ';
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
      qry += '  p.price, ';
      qry += '  p.coeficient, ';
      qry += '  p.offer, ';
      qry += '  p.season, ';
      qry += '  p.quality, ';
      qry += '  p.impulse ';
      qry += 'FROM ';
      qry += '  article a ';
      qry += '  JOIN measurement_unit mu USING(id_measurement_unit) ';
      qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
      qry += '  JOIN subgroup sg USING(id_subgroup) ';
      qry += '  JOIN grupo g USING(id_group) ';
      qry += '  JOIN article_location al USING(id_article) ';
      qry += '  JOIN tmp_price p USING(id_article) ';
      qry += '  LEFT JOIN brand b USING(id_brand) ';
      qry += 'WHERE ';
      qry += '  al.id_location = ? ';
      if(filter_name){
        qry += '  AND LOWER(a.name) LIKE LOWER(' + connection.escape('%'+filter_name+'%') + ') ';
        qry += 'ORDER BY ';
        qry += '  CASE ';
        qry += '    WHEN LOWER(a.name) LIKE LOWER(' + connection.escape(''+filter_name+'%') + ') THEN 0 ';
        qry += '    WHEN LOWER(a.name) LIKE LOWER(' + connection.escape('% %'+filter_name+'% %') + ') THEN 1 ';
        qry += '    WHEN LOWER(a.name) LIKE LOWER(' + connection.escape('%'+filter_name) + ') THEN 2 ';
        qry += '    ELSE 3 ';
        qry += '  END, a.name;';
      } else{
        qry += 'ORDER BY a.name;';
      }
      parametros.push(globals.ARTICULO_SIMPLE);
      parametros.push(id_location);

      // Articulos complejos.
      qry += 'SELECT ';
      qry += '  ac.*, ';
      qry += '  ? tipo, ';
      qry += '  sg.name subgroup_name, ';
      qry += '  g.name group_name, ';
      qry += '  pca.price, ';
      qry += '  pca.coeficient, ';
      qry += '  pca.offer, ';
      qry += '  pca.season, ';
      qry += '  pca.quality, ';
      qry += '  pca.impulse ';
      qry += 'FROM ';
      qry += '  complex_article ac ';
      qry += '  JOIN subgroup sg USING(id_subgroup) ';
      qry += '  JOIN grupo g USING(id_group) ';
      qry += '  JOIN complex_article_location al USING(id_complex_article) ';
      qry += '  JOIN tmp_price_complex pca USING(id_complex_article) ';
      qry += 'WHERE ';
      qry += '  al.id_location = ? ';
      qry += '  AND (ac.effective_date IS NULL OR ac.effective_date >= NOW()) ';
      if(filter_name){
        qry += '  AND LOWER(ac.name) LIKE LOWER(' + connection.escape('%'+filter_name+'%') + ') ';
        qry += 'ORDER BY ';
        qry += '  CASE ';
        qry += '    WHEN LOWER(ac.name) LIKE LOWER(' + connection.escape(''+filter_name+'%') + ') THEN 0 ';
        qry += '    WHEN LOWER(ac.name) LIKE LOWER(' + connection.escape('% %'+filter_name+'% %') + ') THEN 1 ';
        qry += '    WHEN LOWER(ac.name) LIKE LOWER(' + connection.escape('%'+filter_name) + ') THEN 2 ';
        qry += '    ELSE 3 ';
        qry += '  END, ac.name;';
      } else {
        qry += 'ORDER BY ac.name;';
      }
      parametros.push(globals.ARTICULO_COMPLEJO);
      parametros.push(id_location);

      //Detalles Articulos complejos.
      qry += 'SELECT ';
      qry += '  DISTINCT ';
      qry += '  ac.id_complex_article, ';
      qry += '  a.id_article, ';
      qry += '  a.name, ';
      qry += '  a.article_image_url, ';
      qry += '  cad.scale_complex, ';
      qry += '  cad.equivalence_complex, ';
      qry += '  muc.abbreviation measurement_unit_abbreviation_complex, ';
      qry += '  muc.abbreviation_plural measurement_unit_abbreviation_plural_complex, ';
      qry += '  mue.abbreviation measurement_unit_equivalence_abbreviation, ';
      qry += '  mue.abbreviation_plural measurement_unit_equivalence_abbreviation_plural ';
      qry += 'FROM ';
      qry += '  complex_article ac ';
      qry += '  JOIN complex_article_detail cad USING(id_complex_article) ';
      qry += '  JOIN article a ON(a.id_article = cad.id_article) ';
      qry += '  JOIN measurement_unit muc ON(muc.id_measurement_unit = cad.id_measurement_unit) ';
      qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
      qry += '  JOIN complex_article_location al USING(id_complex_article) ';
      qry += '  JOIN tmp_price_complex pca USING(id_complex_article) ';
      qry += 'WHERE ';
      qry += '  al.id_location = ? ';
      qry += '  AND (ac.effective_date IS NULL OR ac.effective_date >= NOW()) ';
      qry += 'ORDER BY ac.name;';
      parametros.push(globals.ARTICULO_COMPLEJO);
      parametros.push(id_location);

      qry_callback = connection.query(qry, parametros, function(err, articles) {
     //   console.log(qry_callback.sql);
        if (err) {
          return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
        }

        var complex_article_detail = {};

        for (var i = 0; i < articles[2].length; i++) {

          var articulo = articles[2][i];
          if(!(articulo.id_complex_article in complex_article_detail)) {
            complex_article_detail[articulo.id_complex_article] = [];
          }
          complex_article_detail[articulo.id_complex_article].push(articulo);
        }

//console.log('articles[0].concat(articles[1])');
//console.log(articles[0].concat(articles[1]));
        
        res.jsonp([{ articles: articles[0].concat(articles[1]), complex_article_detail: complex_article_detail }]);
      });
    });
  });
};

/*exports.get_complex_article_detail = function(req, res) {
  //Retornar los el detalle de los articulos complejos como unidades de medida, escalas y equivalencias
  var msg = 'TODO OK';
  var error = false;

  if(req.body !== undefined && req.body !== null) {
    var id_complex_article = req.body.id_complex_article;

    var qry = '';
    var qry_callback ;
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error al obtener los detalles del articulo complejo indicado.';
        error = true;
        console.log(msg+err);
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      qry = 'SELECT acd.* FROM complex_article_detail ';
      qry += 'JOIN measurement_unit mu USING(acd.id_measurement_unit) ';
      qry += 'JOIN article a USING(acd.id_article) ';
      qry += 'WHERE acd.id_complex_article = ?;';
      qry_callback = connection.query(qry, [id_complex_article], function(err, complex_article_detail) {
        if(err) {
          msg = 'Error obtener los detalles del articulo complejo indicado.';
          error = true;
          console.log(msg+err);
          return connection.rollback(function() { res.jsonp([{ error: error, msg: msg }]); });
        }
        console.log('------------------Gondola art complejos (get_complex_article_detail)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Gondola art complejos (get_complex_article_detail)--------------------');
        res.jsonp(complex_article_detail);
      });
    });

  }else {
    msg = 'Sucedió un error al recibir los parámetros.';
    console.log (msg);
    error = true;
    res.jsonp([{ error: error, msg: msg }]);
    return;
  }
};*/

/**
 * Article Gondola middleware
 */
exports.articleGondolaById = function(req, res, next, id) {
  req.getConnection(function(err, connection) {
    if (err) {
      return next(err);
    }
    var qry = '';
    qry += 'SELECT ';
    qry += '  a.*, ';
    qry += '  mu.name measurement_unit_name, ';
    qry += '  mu.abbreviation measurement_unit_abbreviation, ';
    qry += '  mu.abbreviation_plural measurement_unit_abbreviation_plural, ';
    qry += '  mue.name measurement_unit_equivalence_name, ';
    qry += '  mue.abbreviation measurement_unit_equivalence_abbreviation, ';
    qry += '  mue.abbreviation_plural measurement_unit_equivalence_abbreviation_plural, ';
    qry += '  sg.name subgroup_name, ';
    qry += '  CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0), "", LPAD(a.code, 3, 0)) full_code, ';
    qry += '  g.name group_name, ';
    qry += '  b.name brand_name ';
    qry += 'FROM ';
    qry += '  article a ';
    qry += '  JOIN measurement_unit mu USING(id_measurement_unit) ';
    qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
    qry += '  JOIN subgroup sg USING(id_subgroup) ';
    qry += '  JOIN group g USING(id_group) ';
    qry += '  LEFT JOIN brand b USING(id_brand) ';
    qry += 'WHERE ';
    qry += '  a.id_article = ?';
    connection.query(qry, [id], function(err, articles) {
      if (err) {
        return next(err);
      } else if (!articles.length) {
        return res.status(404).send({ message: 'No se ha encontrado el artículo.' });
      }
      req.article = articles[0];
      next();
    });
  });
};
