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

/*
* FERIADOS o DIAS en los que NO SE REALIZAN ENTREGAS
*/

//Días no laborales del año
exports.get_not_work_dates = function(req, res) {
  var msg = 'TODO OK';
  var error = false;

  if(req.user !== undefined && req.user !== null && req.query !== undefined && req.query !== null) {
    var id_location = req.query.id_location;
    var id_zone = req.query.id_zone;
    
    var qry = '';
    var qry_callback ;
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error obtener los días no laborales para la localidad y zona indicada.';
        error = true;
        console.log(msg+err);
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      qry = 'SELECT sd.* FROM not_work_date ';
      qry += 'JOIN zone z USING(id_zone) ';
      qry += 'WHERE sd.id_location = ? AND sd.id_zone = ?;';
      qry_callback = connection.query(qry, [id_location, id_zone], function(err, not_work_dates) {
        if(err) {
          msg = 'Error obtener los datos de los días no laborales para la localidad y zona indicada.';
          error = true;
          console.log(msg+err);
          return connection.rollback(function() { res.jsonp([{ error: error, msg: msg }]); });
        }
        console.log('------------------Parámetros de basket (get_not_work_dates)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Parámetros de basket (get_not_work_dates)--------------------');
        res.jsonp(not_work_dates);
      });
    });
  
  }else {
    msg = 'Sucedió un error al recibir los parámetros.';
    console.log (msg);
    error = true;          
    res.jsonp([{ error: error, msg: msg }]);
    return; 
  }
};

//Todos los días no laborales para cualquier localidad y zona
exports.list_not_work_dates = function(req, res) {
 
  if(req.query.id_zone === undefined || req.query.id_zone === null){
    return res.status(400).send({ message: 'Debe ingresar la localidad.' });
  }

  var msg = 'TODO OK';
  var error = false;
  
  var id_location = parseInt(req.query.id_location);
  var id_zone = parseInt(req.query.id_zone);

  var qry = '';
  var qry_callback ;
  
  if(req.user !== undefined && req.user !== null) {

    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error obtener el día no laboral.';
        error = true;
        console.log(msg+err);
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }
      
      var count = req.query.count || 5;
      var page = req.query.page || 1;

      //WHERE.
      var where = 'WHERE sd.id_zone = ' + connection.escape(id_zone) + ' ';
      
      //ORDER BY.
      var order_by = mysql_helper.getOrderBy('sd.created', req.query.sorting);

      //LIMIT.
      var rtdo_limit_pag = mysql_helper.getLimitAndPagination(page, count);
      var pagination = rtdo_limit_pag.pagination;
      var limit = rtdo_limit_pag.limit;

      qry += 'SELECT COUNT(*) total_count FROM not_work_date sd ';
    //  qry += '  JOIN user u USING(id_user) ';
      qry += where;
      qry += order_by;
      qry += limit;
      qry_callback = connection.query(qry, [], function(err, results) {
   
        console.log('------------------Parámetros de basket (list_not_work_dates)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Parámetros de basket (list_not_work_dates)--------------------');

        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }

        //console.log('results');console.log(JSON.stringify(results));
        var total_count = 0;
        if(results[0].length){
          total_count = results[0][0].total_count;
        }
        var not_work_date = results[1];
        var result = mysql_helper.getResult(not_work_date, total_count, pagination);

        res.jsonp(result);
      });
    }); 
  }else {
    msg = 'Sucedió un error al recibir los parámetros.';
    console.log (msg);
    error = true;
    console.log(msg);
    res.jsonp([{ error: error, msg: msg }]);
    return;
  }
};

//Agrega un nuevo día no laboral en una localidad y zona
exports.add_not_work_dates = function(req, res) {
  var msg = 'TODO OK';
  var error = false;
  
  if(req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null && req.query !== undefined && req.query !== null) {
    
    var not_work_date = req.body.not_work_date;
    var id_user = req.user.id_user;
    
    var id_location = req.query.id_location;
    var id_zone = req.query.id_zone;
    
    var qry = '';
    var qry_callback ;
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error agregar el día no laboral.';
        error = true;
        console.log(msg+err);
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      qry = 'INSERT INTO not_work_date (not_work_date, id_location, id_zone, id_user_created, modified, id_user_modified) ';          
      qry += 'VALUES (?, ?, ?, ?, ?, NOW(), ?); ';
      qry_callback = connection.query(qry, [not_work_date, id_location, id_zone, id_user, id_user], function(err, not_work_date) {
        if(err) {
          msg = 'Error al actualizar los datos del día no laboral.';
          error = true;
          return connection.rollback(function() { res.jsonp([{ error: error, msg: msg }]); });
        }
        console.log('------------------Parámetros de basket (add_not_work_dates)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Parámetros de basket (add_not_work_dates)--------------------');
        res.jsonp([not_work_date]);
      });
    });
  
  }else {
    msg = 'Sucedió un error al recibir los parámetros.';
    console.log (msg);
    error = true;
    console.log(msg);
    res.jsonp([{ error: error, msg: msg }]);
    return; 
  }
};

//Actualiza/cambia un día de entrega existente (id_not_work_date) para una dada localidad y zona
exports.delete_not_work_dates = function(req, res) {

  var msg = 'TODO OK';
  var error = false;
  
  if(req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null) {
    var id_user = req.user.id_user;
    var not_work_dates = req.body.not_work_dates;
    var qry = '';
    var qry_callback = '';
    
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error al eliminar el día no laboral.';
        error = true;
        console.log(msg);
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      var not_work_date_delete = [];
      var now = new Date().toISOString();
      for (var i = 0, len = not_work_dates.length; i < len; i++) {
        if (not_work_dates[i].id_not_work_date !== null && not_work_dates[i].id_not_work_date !== undefined) {
          not_work_date_delete.push([ not_work_dates[i].id_not_work_date ]);
        }
      }

      qry = 'DELETE FROM not_work_date WHERE id_not_work_date = ?';      
      qry_callback = connection.query(qry, [not_work_date_delete], function(err, not_work_date) {
        if(err) {
          msg = 'Error al eliminar el día no laboral.';
          error = true;
          console.log(msg+err);
          return connection.rollback(function() { res.jsonp([{ error: error, msg: msg }]); });
        }

        console.log('------------------Parámetros de basket (delete_not_work_dates)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Parámetros de basket (delete_not_work_dates)--------------------');
        res.jsonp([not_work_date]);
      });
    });
      
  } else {
    msg = 'Sucedió un error al recibir los parámetros.';
    console.log (msg);
    error = true;          
    res.jsonp([{ error: error, msg: msg }]);
    return; 
  }
};