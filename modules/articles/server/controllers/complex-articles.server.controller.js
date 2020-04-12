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
 * Show the current Complex Article
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var complex_article = req.complex_article ? req.complex_article : {};
  res.jsonp(complex_article);
};

/**
 * Create a Complex Article
 */
exports.create = function(req, res) {
  //Verifico que se hayan enviado articulos.
  var articles = req.body.articles;
  if(!articles.length){
    return res.status(400).send({
      message: 'Debe agregar artículos.'
    });
  }

  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    //Se crea el json para cargar la cabecera del articulo complejo.
    var complex_article = {
      id_subgroup: req.body.id_subgroup,
      name: req.body.name,
      description: req.body.description,
      effective_date: req.body.effective_date
    };

    //Se busca el codigo mas alto para crear el articulo con el codigo que corresponda.
    var max_code = 0;
    var qry = 'SELECT MAX(code) code FROM complex_article WHERE id_subgroup = ? ';
    connection.query(qry, [complex_article.id_subgroup], function(err, maxResult) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      if(maxResult.length){
        max_code = maxResult[0].code;
      }
      connection.beginTransaction(function(err) {
        if (err) {
          return res.status(400).send({
            message: 'Error al crear el articulo complejo.'
          });
        }
        complex_article.code = max_code + 1;
        qry = 'INSERT INTO complex_article SET ? ';
        var qry_callback = connection.query(qry, complex_article, function(err, result) {
          /*console.log(qry_callback.sql);*/
          if (err) {
            return connection.rollback(function() {
              return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
              });
            });
          }
          complex_article.id_complex_article = result.insertId;

          //Recorro los aticulos a agregar.
          var complex_articles_array_insert = [];
          async.eachSeries(articles, function(article, callback) {
            var complex_article_array = [
              complex_article.id_complex_article,
              article.id_article,
              article.id_measurement_unit_scale,
              article.scale_complex,
              article.equivalence_complex
            ];
            complex_articles_array_insert.push(complex_article_array);
            callback();
          }, function(err) {
            if(err) {
              return connection.rollback(function() {
                return res.status(400).send({
                  message: errorHandler.getErrorMessage(err)
                });
              });
            }
            qry = 'INSERT INTO complex_article_detail (id_complex_article, id_article, id_measurement_unit, scale_complex, equivalence_complex) VALUES ? ;';
            qry_callback = connection.query(qry, [complex_articles_array_insert], function(err, result) {
              /*console.log(qry_callback.sql);*/
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
                res.jsonp(complex_article);
              });
            });
          });
        });
      });
    });
  });
};

exports.update = function(req, res) {
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    var id_complex_article = req.body.id_complex_article;
    //Se crea el json para cargar la cabecera del articulo complejo.
    var complex_article = {
      name: req.body.name,
      description: req.body.description,
      effective_date: req.body.effective_date
    };

    var qry = 'UPDATE complex_article SET ?, modified = NOW() WHERE id_complex_article = ?;';
    var qry_callback = connection.query(qry, [complex_article, id_complex_article], function(err, result) {
      /*console.log(qry_callback.sql);*/
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      complex_article.id_complex_article = id_complex_article;
      res.jsonp(complex_article);
    });
  });
};

exports.image = function(req, res) {
  var complex_article = req.complex_article ;
  var upload = multer(config.uploads.articleUpload).single('newArticlePicture');
  var articleUploadFileFilter = require(path.resolve('./config/lib/multer')).articleUploadFileFilter;

  // Filtering to upload only images
  upload.fileFilter = articleUploadFileFilter;

  upload(req, res, function (uploadError) {
    if(uploadError) {
      return res.status(400).send({
        message: 'Ocurrió un error al cargar la imagen del artículo complejo.'
      });
    } else {
      req.getConnection(function(err, connection) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        complex_article.article_image_url = config.uploads.articleUpload.dest + req.file.filename;
        var qry = 'UPDATE complex_article SET article_image_url = ? WHERE id_complex_article = ?;';
        connection.query(qry, [complex_article.article_image_url, complex_article.id_complex_article], function(err, result) {
          if (err) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          }
          res.jsonp(complex_article);
        });
      });
    }
  });
};

exports.add_article = function(req, res) {
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    var qry = '';
    var qry_callback;
    var complex_article_array = [
      req.body.id_complex_article,
      req.body.article.id_article,
      req.body.article.id_measurement_unit_scale,
      req.body.article.scale_complex,
      req.body.article.equivalence_complex
    ];

    var complex_articles_array_insert = [complex_article_array];
    qry = 'INSERT INTO complex_article_detail ';
    qry += '  (id_complex_article, id_article, id_measurement_unit, scale_complex, equivalence_complex) ';
    qry += 'VALUES ? ';
    qry += 'ON DUPLICATE KEY UPDATE ';
    qry += ' id_measurement_unit = VALUES(id_measurement_unit), ';
    qry += ' scale_complex = VALUES(scale_complex), ';
    qry += ' equivalence_complex = VALUES(equivalence_complex);';
    qry_callback = connection.query(qry, [complex_articles_array_insert], function(err, result) {
      /*console.log(qry_callback.sql);*/
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.jsonp([]);
    });
  });
};

exports.remove_article = function(req, res) {
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    var qry = '';
    var qry_callback;
    qry = 'DELETE FROM complex_article_detail WHERE id_complex_article = ? AND id_article = ?;';
    qry_callback = connection.query(qry, [req.body.id_complex_article, req.body.article.id_article], function(err, result) {
      /*console.log(qry_callback.sql);*/
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.jsonp([]);
    });
  });
};

/**
 * List of Complex Articles
 */
exports.list_complex = function(req, res) {
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
    qry += '  complex_article a ';
    qry += '  JOIN subgroup sg USING(id_subgroup) ';
    qry += '  JOIN grupo g USING(id_group) ';
    qry += where;
    qry += ';';
    qry += 'SELECT ';
    qry += '  a.*, ';
    qry += '  sg.name subgroup_name, ';
    qry += '  CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0), "", LPAD(a.code, 8, 0)) full_code, ';
    qry += '  g.name group_name ';
    qry += 'FROM ';
    qry += '  complex_article a ';
    qry += '  JOIN subgroup sg USING(id_subgroup) ';
    qry += '  JOIN grupo g USING(id_group) ';
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
      var articles = results[1];
      var result = mysql_helper.getResult(articles, total_count, pagination);
      res.jsonp(result);
    });
  });
};

/**
 * Complex Article middleware
 */
exports.complexArticleByID = function(req, res, next, id_complex_article) {
  req.getConnection(function(err, connection) {
    if (err) {
      return next(err);
    }
    var qry = '';
    qry += 'SELECT ';
    qry += '  ca.*, ';
    qry += '  sg.name subgroup_name, ';
    qry += '  CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0), "", LPAD(ca.code, 8, 0)) full_code, ';
    qry += '  g.name group_name ';
    qry += 'FROM ';
    qry += '  complex_article ca ';
    qry += '  JOIN subgroup sg USING(id_subgroup) ';
    qry += '  JOIN grupo g USING(id_group) ';
    qry += 'WHERE ';
    qry += '  ca.id_complex_article = ? ';
    var qry_callback = connection.query(qry, [id_complex_article], function(err, complex_articles) {
      console.log(qry_callback.sql);
      if (err) {
        return next(err);
      } else if (!complex_articles.length) {
        return res.status(404).send({
          message: 'No se ha encontrado el artículo complejo.'
        });
      }
      qry = 'SELECT ';
      qry += '  a.*, ';
      qry += '  cad.id_measurement_unit id_measurement_unit_scale, ';
      qry += '  cad.scale_complex, ';
      qry += '  cad.equivalence_complex, ';
      qry += '  mu.abbreviation measurement_unit_abbreviation, ';
      qry += '  mu.abbreviation measurement_unit_abbreviation_plural, ';
      qry += '  muc.abbreviation measurement_unit_abbreviation_complex, ';
      qry += '  muc.abbreviation measurement_unit_abbreviation_plural_complex, ';
      qry += '  mue.abbreviation measurement_unit_equivalence_abbreviation, ';
      qry += '  mue.abbreviation_plural measurement_unit_equivalence_abbreviation_plural, ';
      qry += '  CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0), "", LPAD(a.code, 3, 0)) full_code, ';
      qry += '  b.name brand_name ';
      qry += 'FROM ';
      qry += '  complex_article_detail cad ';
      qry += '  JOIN article a USING(id_article) ';
      qry += '  JOIN measurement_unit mu ON(mu.id_measurement_unit = a.id_measurement_unit) ';
      qry += '  JOIN measurement_unit muc ON(muc.id_measurement_unit = cad.id_measurement_unit) ';
      qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
      qry += '  JOIN subgroup sg USING(id_subgroup) ';
      qry += '  JOIN grupo g USING(id_group) ';
      qry += '  LEFT JOIN brand b USING(id_brand) ';
      qry += 'WHERE ';
      qry += '  cad.id_complex_article = ?;';
      connection.query(qry, [id_complex_article], function(err, articles) {
        if (err) {
          return next(err);
        }
        req.complex_article = complex_articles[0];
        req.complex_article.articles = articles;
        next();
      });
    });
  });
};
