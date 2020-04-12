'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  globals = require(path.resolve('.','./config/globals')),
  mysql_helper = require(path.resolve('.','./config/mysql_helper')),
  multer = require('multer'),
  config = require(path.resolve('./config/config')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');

/**
 * Show the current Article
 */
exports.read = function(req, res) {
  var article = req.article ? req.article : {};
  res.jsonp(article);
};

/**
 * Create a Article
 */
exports.create = function(req, res) {
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    var article = {
      id_subgroup: req.body.id_subgroup,                      
      name: req.body.name,                           
      description: req.body.description,                     
      base_expiration: req.body.base_expiration,                 
      scale: req.body.scale,                          
      show_equivalence: req.body.show_equivalence,               
      temperature: req.body.temperature,                    
      humidity: req.body.humidity,                                     
      fragility: req.body.fragility,                                     
      color: req.body.color,                          
      id_brand: req.body.id_brand,                       
      id_measurement_unit: req.body.id_measurement_unit,            
      id_measurement_unit_equivalence: req.body.id_measurement_unit_equivalence,
      equivalence: req.body.equivalence,                    
      nutritional_information: req.body.nutritional_information,
      season_1: req.body.season_1.index,
      season_2: req.body.season_2.index, 
      season_3: req.body.season_3.index, 
      season_4: req.body.season_4.index, 
      season_5: req.body.season_5.index, 
      season_6: req.body.season_6.index, 
      season_7: req.body.season_7.index, 
      season_8: req.body.season_8.index, 
      season_9: req.body.season_9.index, 
      season_10: req.body.season_10.index,
      season_11: req.body.season_11.index,
      season_12: req.body.season_12.index
    };
    //Se busca el codigo mas alto para crear el articulo con el codigo que corresponda.
    var max_code = 0;
    var qry = 'SELECT MAX(code) code FROM article WHERE id_subgroup = ? ';
    connection.query(qry, [article.id_subgroup], function(err, maxResult) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      if(maxResult.length){
        max_code = maxResult[0].code;
        if(max_code >= 999){
          return res.status(400).send({
            message: 'Ya no se pueden crear artículos para este subgrupo.'
          });
        }
      }
      article.code = max_code + 1;
      qry = 'INSERT INTO article SET ? ';
      connection.query(qry, article, function(err, result) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        article.id_article = result.insertId;
        res.jsonp(article);
      });
    });
  });
};

exports.image = function(req, res) {
  var article = req.article ;
  var upload = multer(config.uploads.articleUpload).single('newArticlePicture');
  var articleUploadFileFilter = require(path.resolve('./config/lib/multer')).articleUploadFileFilter;
  
  // Filtering to upload only images
  upload.fileFilter = articleUploadFileFilter;

  upload(req, res, function (uploadError) {
    if(uploadError) {
      return res.status(400).send({
        message: 'Ocurrió un error al cargar la imagen del artículo.'
      });
    } else {
      req.getConnection(function(err, connection) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        article.article_image_url = config.uploads.articleUpload.dest + req.file.filename;
        var qry = 'UPDATE article SET article_image_url = ? WHERE id_article = ? ';
        connection.query(qry, [article.article_image_url, article.id_article], function(err, result) {
          if (err) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          }
          res.jsonp(article);
        });
      });
    } 
  });
};

/**
 * Update a Article
 */
exports.update = function(req, res) {
  var article = req.article ;
  //Se obtienen el subgrupo viejo y el nuevo.
  var old_subgroup = article.id_subgroup;
  var new_subgroup = req.body.id_subgroup;

  //Se explaya el valor del form en el objeto articulo.
  article = _.extend(article , req.body);
  var article_update = {
    id_subgroup: article.id_subgroup,                      
    name: article.name,                           
    description: article.description,                     
    base_expiration: article.base_expiration,                 
    scale: article.scale,                          
    show_equivalence: article.show_equivalence,               
    temperature: article.temperature,                    
    humidity: article.humidity,                                     
    fragility: article.fragility,                                     
    color: article.color,                          
    id_brand: article.id_brand,                       
    id_measurement_unit: article.id_measurement_unit,            
    id_measurement_unit_equivalence: article.id_measurement_unit_equivalence,
    equivalence: article.equivalence,                    
    nutritional_information: article.nutritional_information,
    season_1: article.season_1.index,
    season_2: article.season_2.index, 
    season_3: article.season_3.index, 
    season_4: article.season_4.index, 
    season_5: article.season_5.index, 
    season_6: article.season_6.index, 
    season_7: article.season_7.index, 
    season_8: article.season_8.index, 
    season_9: article.season_9.index, 
    season_10: article.season_10.index,
    season_11: article.season_11.index,
    season_12: article.season_12.index
  };
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    var qry = '';
    //Si modifico el subgrupo.
    if(old_subgroup !== new_subgroup){
      //Se busca el codigo mas alto para crear el subgrupo con el codigo que corresponda.
      var max_code = 0;
      qry = 'SELECT MAX(code) code FROM article WHERE id_subgroup = ? ';
      connection.query(qry, [article.id_subgroup], function(err, maxResult) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        if(maxResult.length){
          max_code = maxResult[0].code;
          if(max_code >= 999){
            return res.status(400).send({
              message: 'Ya no se pueden crear artículos para este subgrupo.'
            });
          }
        }
        article_update.code = max_code + 1;
        qry = 'UPDATE article SET ?, modified = NOW() WHERE id_article = ' + connection.escape(article.id_article);
        connection.query(qry, article_update, function(err, result) {
          if (err) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          }
          res.jsonp(article);
        });
      });
    } else{
      qry = 'UPDATE article SET ?, modified = NOW() WHERE id_article = ' + connection.escape(article.id_article);
      connection.query(qry, article_update, function(err, result) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        res.jsonp(article);
      });
    }
  });
};

/**
 * List of Articles
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
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.jsonp(articles);
    });
  });
};

/**
 * Get articles.
 * @param  {[type]} req [description]
 * @param  {[type]} res [description]
 * @return {[type]}     [description]
 */
exports.get_articles = function(req, res) { 
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
    qry += 'WHERE ';
    qry += '  LOWER(a.name) LIKE LOWER(' + connection.escape(req.query.name+'%') + ')';
    qry += 'ORDER BY a.name;';
    connection.query(qry, [], function(err, articles) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.jsonp(articles);
    });
  });
};

/**
 * List of Articles
 */
exports.list = function(req, res) {
  //Si se pregunta por todos los articulos sin ningun tipo de filtro. 
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
    qry += where;
    qry += ';';
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
    qry += where;
    qry += order_by;
    qry += limit;
    var qry_callback = connection.query(qry, [], function(err, results) {
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
};

/**
 * Article middleware
 */
exports.articleByID = function(req, res, next, id_article) {
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
    qry += '  JOIN grupo g USING(id_group) ';
    qry += '  LEFT JOIN brand b USING(id_brand) ';
    qry += 'WHERE ';
    qry += '  a.id_article = ? ';
    connection.query(qry, [id_article], function(err, articles) {
      if (err) {
        return next(err);
      } else if (!articles.length) {
        return res.status(404).send({
          message: 'No se ha encontrado el artículo.'
        });
      }
      req.article = articles[0];
      next();
    });
  });
};