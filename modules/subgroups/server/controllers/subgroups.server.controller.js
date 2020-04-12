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
 * Create a Subgroup
 */
exports.create = function(req, res) {
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    var subgroup = {
      id_group: req.body.id_group,                      
      name: req.body.name,                           
      description: req.body.description
    };
    //Se busca el codigo mas alto para crear el articulo con el codigo que corresponda.
    var max_code = 0;
    var qry = 'SELECT MAX(code) code FROM subgroup WHERE id_group = ? ';
    connection.query(qry, [subgroup.id_group], function(err, maxResult) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      if(maxResult.length){
        max_code = maxResult[0].code;
        if(max_code >= 999){
          return res.status(400).send({
            message: 'Ya no se pueden crear subgrupos para este grupo.'
          });
        }
      }
      subgroup.code = max_code + 1;
      qry = 'INSERT INTO subgroup SET ? ';
      connection.query(qry, subgroup, function(err, result) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        subgroup.id_subgroup = result.insertId;
        res.jsonp(subgroup);
      });
    });
  });
};

/**
 * Show the current Subgroup
 */
exports.read = function(req, res) {
  // convert mongoose document to JSON
  var subgroup = req.subgroup ? req.subgroup : {};
  res.jsonp(subgroup);
};

/**
 * Update a Subgroup
 */
exports.update = function(req, res) {
  var subgroup = req.subgroup ;
  //Se obtienen el subgrupo viejo y el nuevo.
  var old_group = subgroup.id_group;
  var new_group = req.body.id_group;

  //Se explaya el valor del form en el objeto articulo.
  subgroup = _.extend(subgroup , req.body);
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    //Si modifico el subgrupo.
    if(old_group !== new_group){
      //Se busca el codigo mas alto para crear el subgrupo con el codigo que corresponda.
      var max_code = 0;
      var qry = 'SELECT MAX(code) code FROM subgroup WHERE id_group = ? ';
      connection.query(qry, [subgroup.id_group], function(err, maxResult) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        if(maxResult.length){
          max_code = maxResult[0].code;
          if(max_code >= 999){
            return res.status(400).send({
              message: 'Ya no se pueden crear subgrupos para este grupo.'
            });
          }
        }
        subgroup.code = max_code + 1;
        var subgroup_update = {
          id_group: subgroup.id_group,
          code: subgroup.code,
          name: subgroup.name,
          description: subgroup.description,
          id_status: subgroup.id_status
        };
        var qry2 = 'UPDATE subgroup SET ?, modified = NOW() WHERE id_subgroup = ' + connection.escape(subgroup.id_subgroup);
        connection.query(qry2, subgroup_update, function(err, result) {
          if (err) {
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          }
          res.jsonp(subgroup);
        });
      });
    } else{
      var subgroup_update = {
        id_group: subgroup.id_group,
        code: subgroup.code,
        name: subgroup.name,
        description: subgroup.description,
        id_status: subgroup.id_status
      };
      var qry2 = 'UPDATE subgroup SET ?, modified = NOW() WHERE id_subgroup = ' + connection.escape(subgroup.id_subgroup);
      connection.query(qry2, subgroup_update, function(err, result) {
        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }
        res.jsonp(subgroup);
      });
    }
  });
};

/**
 * Delete an Subgroup
 */
exports.delete = function(req, res) {
  var subgroup = req.subgroup ;
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    var qry = 'UPDATE subgroup SET id_status = ?, modified = NOW() WHERE id_subgroup = ? ';
    connection.query(qry, [globals.NO_ACTIVO, subgroup.id_subgroup], function(err, result) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      subgroup.id_status = globals.NO_ACTIVO;
      res.jsonp(subgroup);
    });
  });
};


/**
 * List of Subgroups
 */
var listAll = function(req, res) { 
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    var where = '';
    if(req.query.no_complex !== undefined){
      where += 'WHERE ';
      where += '  g.complex = 0 ';
    } else if(req.query.complex !== undefined){
      where += 'WHERE ';
      where += '  g.complex = 1 ';
    }
    var qry = '';
    qry += 'SELECT ';
    qry += '  sg.*,  ';
    qry += '  CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0)) full_code, ';
    qry += '  g.name group_name, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  subgroup sg ';
    qry += '  JOIN status st  USING(id_status) ';
    qry += '  JOIN grupo g USING(id_group) ';
    qry += where;
    qry += 'ORDER BY sg.name;';
    connection.query(qry, [], function(err, subgroups) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.jsonp(subgroups);
    });
  });
};

/**
 * List of Subgroups
 */
exports.list = function(req, res) {
  //Si se pregunta por todos los subgrupos sin ningun tipo de filtro. 
  if(req.query.all !== undefined || req.query.no_complex !== undefined || req.query.complex !== undefined){
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
    var order_by = mysql_helper.getOrderBy('sg.name', req.query.sorting);
    
    //LIMIT.
    var rtdo_limit_pag = mysql_helper.getLimitAndPagination(page, count);
    var pagination = rtdo_limit_pag.pagination;
    var limit = rtdo_limit_pag.limit;

    var qry = '';
    qry += 'SELECT ';
    qry += '  COUNT(*) total_count ';
    qry += 'FROM ';
    qry += '  subgroup sg ';
    qry += '  JOIN status st  USING(id_status) ';
    qry += '  JOIN grupo g USING(id_group) ';
    qry += where;
    qry += '; ';
    qry += 'SELECT ';
    qry += '  sg.*, ';
    qry += '  CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0)) full_code, ';
    qry += '  g.name group_name, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  subgroup sg ';
    qry += '  JOIN status st  USING(id_status) ';
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
      var subgroups = results[1];
      var result = mysql_helper.getResult(subgroups, total_count, pagination);

      res.jsonp(result);
    });
  }); 
};

/**
 * Subgroup middleware
 */
exports.subgroupByID = function(req, res, next, id_subgroup) {
  req.getConnection(function(err, connection) {
    if (err) {
      return next(err);
    }
    var qry = '';
    qry += 'SELECT ';
    qry += '  sg.*, ';
    qry += '  CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0)) full_code, ';
    qry += '  g.name group_name, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  subgroup sg ';
    qry += '  JOIN status st USING(id_status) ';
    qry += '  JOIN grupo g USING(id_group) ';
    qry += 'WHERE ';
    qry += '  sg.id_subgroup = ? ';
    connection.query(qry, [id_subgroup], function(err, subgroups) {
      if (err) {
        return next(err);
      } else if (!subgroups.length) {
        return res.status(404).send({
          message: 'No se ha encontrado el subgrupo.'
        });
      }
      req.subgroup = subgroups[0];
      next();
    });
  });
};