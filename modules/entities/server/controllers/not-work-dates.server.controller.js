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

//Obtiene los días no laborables del año para una dada zona y localidad
exports.get_not_work_dates = function(req, res) {
 
  var msg = 'TODO OK';
  var error = false;
  
  if(req.user !== undefined && req.user !== null && req.query !== undefined && req.query !== null) {
    var id_location = req.query.id_location;
    var id_zone = req.query.id_zone;
    
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error obtener los días no laborables para la localidad y zona indicada.';
        error = true;
        console.log(msg+err);
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      var qry = '';
      var qry_callback ;
      qry = 'SELECT nw.* FROM not_work_date nw ';
      qry += 'JOIN zone z USING(id_zone, id_location) ';
      qry += 'WHERE nw.id_location = ? AND nw.id_zone = ?;';
      qry_callback = connection.query(qry, [id_location, id_zone], function(err, not_work_dates) {
        if(err) {
          msg = 'Error obtener los datos de los días no laborables para la localidad y zona indicada.';
          error = true;
          console.log(msg+err);
          return connection.rollback(function() { res.jsonp([{ error: error, msg: msg }]); });
        }
        console.log('------------------Día no laborable (list_not_work_dates)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Día no laborable (list_not_work_dates)--------------------');
        res.jsonp([not_work_dates]);
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

//Elimina todos días no laborables cargados para una dada localidad y zona
exports.delete_all_not_work_dates = function(req, res) {

  var msg = 'TODO OK';
  var error = false;
  
  if(req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null) {
    
    var id_user = req.user.id_user;
    var id_location = req.body.id_location;
    var id_zone = req.body.id_zone;
    
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error al eliminar el día no laborable.';
        error = true;
        console.log(msg);
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }    

      var qry = '';
      var qry_callback = '';
      qry = 'DELETE FROM not_work_date WHERE id_location = ? AND id_zone = ?';      
      qry_callback = connection.query(qry, [id_location, id_zone], function(err, not_work_date) {
        if(err) {
          msg = 'Error al eliminar los días no laborables.';
          error = true;
          console.log(msg+err);
          return connection.rollback(function() { res.jsonp([{ error: error, msg: msg }]); });
        }

        console.log('------------------Días no laborables (delete_not_work_date)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Días no laborables (delete_not_work_date)--------------------');
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

//Agrega los días no laborables para una localidad y zona
exports.add_not_work_dates = function(req, res) {
  var msg = 'TODO OK';
  var error = false;
  
  if(req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null) {
    
    var not_work_days = req.body.not_work_days;
    var id_user = req.user.id_user;
   
    var id_location = req.body.id_location;
    var id_zone = req.body.id_zone;
       
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error agregar los días no laborables.';
        error = true;
        console.log(msg + ' '+ err);
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }
      
      var not_work_days_insert = [];
      var now = new Date().toISOString();
      for (var i = 0, len = not_work_days.length; i < len; i++) {  
        not_work_days_insert.push([ not_work_days[i], id_location, id_zone, now, id_user, now, id_user ]);
        
      }

      var qry = '';
      var qry_callback ;
      qry = 'INSERT INTO not_work_date (day, id_location, id_zone, created, id_user_created, modified, id_user_modified) ';          
      qry += 'VALUES ?; ';
      qry_callback = connection.query(qry, [not_work_days_insert], function(err, not_work_days) {
        if(err) {
          msg = 'Error al agregar un nuevo horario de entrega.';
          error = true;
          console.log(msg + ' '+ err);
          return connection.rollback(function() { res.jsonp([{ error: error, msg: msg }]); });
        }
        console.log('------------------Días no laborables (add_not_work_dates)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Días no laborables (add_not_work_dates)--------------------');
        res.jsonp([not_work_days]);
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

