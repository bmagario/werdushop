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
* DIAS DE ENTREGA
*/

//Días habilitados para la entrega para la localidad y zona indicadas
exports.get_shipping_dates = function(req, res) {
  var msg = 'TODO OK';
  var error = false;

  if(req.user !== undefined && req.user !== null && req.query !== undefined && req.query !== null) {
    var id_location = req.query.id_location;
    var id_zone = req.query.id_zone;
    
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error obtener los días de entrega para la localidad y zona indicada.';
        error = true;
        console.log(msg+err);
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      var qry = '';
      var qry_callback ;
      qry = 'SELECT sd.* FROM shipping_date ';
      qry += 'JOIN zone z USING(id_zone) ';
      qry += 'WHERE sd.id_location = ? AND sd.id_zone = ? AND sd.id_status = ?;';
      qry_callback = connection.query(qry, [id_location, id_zone, globals.ACTIVO], function(err, shipping_dates) {
        if(err) {
          msg = 'Error obtener los datos de los días de entrega para la localidad y zona indicada.';
          error = true;
          console.log(msg+err);
          return connection.rollback(function() { res.jsonp([{ error: error, msg: msg }]); });
        }
        console.log('------------------Parámetros de basket (get_shipping_dates)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Parámetros de basket (get_shipping_dates)--------------------');
        res.jsonp([shipping_dates]);
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

//Todos los días de entrega (activos o no) para cualquier localidad y zona
exports.list_shipping_dates = function(req, res) {
 
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
        msg = 'Error obtener el día de entrega.';
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

      qry += 'SELECT COUNT(*) total_count FROM shipping_date sd ';
      qry += 'JOIN status st USING(id_status) ';
    //  qry += '  JOIN user u USING(id_user) ';
      qry += where;
      qry += ';';
      qry += 'SELECT ';
      qry += '  sd.*, ';
      qry += '  st.name status_name ';
    //  qry += '  u.display_name, ';
    //  qry += '  CONCAT(u.first_name, " ", u.last_name) user_name ';
      qry += 'FROM ';
      qry += '  shipping_date sd ';
      qry += '  JOIN status st USING(id_status) ';
    //  qry += '  JOIN user u USING(id_user) ';      
      qry += where;
      qry += order_by;
      qry += limit;
      qry_callback = connection.query(qry, [], function(err, results) {
   
        console.log('------------------Parámetros de basket (list_shipping_dates)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Parámetros de basket (list_shipping_dates)--------------------');

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
        var shipping_date = results[1];
        var result = mysql_helper.getResult(shipping_date, total_count, pagination);

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

//Agrega un nuevo día de entrega en una localidad y zona
exports.add_shipping_dates = function(req, res) {
  var msg = 'TODO OK';
  var error = false;
  
  if(req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null && req.query !== undefined && req.query !== null) {
    
    var lun = req.body.lun;
    var mar = req.body.mar;
    var mie = req.body.mie;
    var jue = req.body.jue;
    var vie = req.body.vie;
    var sab = req.body.sab;
    var dom = req.body.dom;

    var id_status = req.body.id_status;

    var id_user = req.user.id_user;
    
    var id_location = req.body.id_location;
    var id_zone = req.body.id_zone;
    
    var qry = '';
    var qry_callback ;
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error agregar el día de entrega.';
        error = true;
        console.log(msg+err);
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      qry = 'INSERT INTO shipping_date (lun, mar, mie, jue, vie, sab, dom, id_status, id_location, id_zone, id_user_created, modified, id_user_modified) ';          
      qry += 'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?); ';
      qry_callback = connection.query(qry, [lun, mar, mie, jue, vie, sab, dom, id_status, id_location, id_zone, id_user, id_user], function(err, shipping_date) {
        if(err) {
          msg = 'Error al actualizar los datos del día de entrega.';
          error = true;
          return connection.rollback(function() { res.jsonp([{ error: error, msg: msg }]); });
        }
        console.log('------------------Parámetros de basket (add_shipping_dates)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Parámetros de basket (add_shipping_dates)--------------------');
        res.jsonp([shipping_date]);
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

//Actualiza/cambia un día de entrega existente (id_shipping_date) para una dada localidad y zona
exports.delete_shipping_dates = function(req, res) {

  var msg = 'TODO OK';
  var error = false;
  
  if(req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null) {
    var id_user = req.user.id_user;
    var shipping_dates = req.body.shipping_dates;
    var qry = '';
    var qry_callback = '';
    
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error al eliminar el día de entrega.';
        error = true;
        console.log(msg);
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      var shipping_date_delete = [];
      var now = new Date().toISOString();
      for (var i = 0, len = shipping_dates.length; i < len; i++) {
        if (shipping_dates[i].id_shipping_date !== null && shipping_dates[i].id_shipping_date !== undefined) {
          shipping_date_delete.push([ shipping_dates[i].id_shipping_date ]);
        }
      }

      qry = 'DELETE FROM shipping_date WHERE id_shipping_date = ?';      
      qry_callback = connection.query(qry, [shipping_date_delete], function(err, shipping_date) {
        if(err) {
          msg = 'Error al eliminar el día de entrega.';
          error = true;
          console.log(msg+err);
          return connection.rollback(function() { res.jsonp([{ error: error, msg: msg }]); });
        }

        console.log('------------------Parámetros de basket (delete_shipping_dates)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Parámetros de basket (delete_shipping_dates)--------------------');
        res.jsonp([shipping_date]);
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

function on_off_shipping_date(req, res, habilitar) {
  var msg = 'TODO OK';
  var error = false;

  if(req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null) {
    var id_user = req.user.id_user;
    var shipping_dates = req.body.id_shipping_dates;

    var status = globals.NO_ACTIVO;
    if(habilitar) {
      status = globals.ACTIVO;
    }

    var qry = '';
    var qry_callback ;    
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error al habilitar el día de entrega.';
        error = true;
        console.log(msg);
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      var shipping_date_insert = [];
      var now = new Date().toISOString();
      for (var i = 0, len = shipping_dates.length; i < len; i++) {
        if (shipping_dates[i].id_shipping_date !== null && shipping_dates[i].id_shipping_date !== undefined) {
          shipping_date_insert.push([ status, id_user, shipping_dates[i].id_shipping_date, now ]);
        }
      }

      qry = 'INSERT INTO shipping_date (id_status, id_user_modified, id_shipping_date, modified) VALUES ? ';
      qry += 'ON DUPLICATE KEY UPDATE id_status = ?, id_user_modified = ?, modified = ?;';
 
      qry_callback = connection.query(qry, [shipping_date_insert, status, id_user, now], function(err, shipping_date) {
        if(err) {
          msg = 'Error al habilitar el día de entrega.';
          error = true;
          console.log(msg+err);
          return connection.rollback(function() { res.jsonp([{ error: error, msg: msg }]); });
        }
        console.log('------------------Parámetros de basket (enable_shipping_dates)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Parámetros de basket (enable_shipping_dates)--------------------');
        res.jsonp(shipping_date);
      });
    });
  } else {
    msg = 'Sucedió un error al recibir los parámetros.';
    console.log (msg);
    error = true;          
    res.jsonp([{ error: error, msg: msg }]);
    return; 
  }  
}

//Habilita los días de entrega
exports.enable_shipping_dates = function(req, res) {
  on_off_shipping_date(req, res, true);
};

//Deshabilita los días de entrega
exports.disable_shipping_dates = function(req, res) {
  on_off_shipping_date(req, res, false);
};