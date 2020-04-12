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
* HORARIOS DE ENTREGA
*/
/*exports.read = function(req, res) {
  var shipping_time = req.shipping_time ? req.shipping_time : {};
  res.jsonp(shipping_time);
};*/
/**
 * Se obtiene el horario de entrega solicitado.
 * @param  {[type]}   req               [description]
 * @param  {[type]}   res               [description]
 * @param  {Function} next              [description]
 * @param  {[type]}   id_shipping_time  [description]
 * @return {[type]}                     [description]
 */
exports.shippingTimesByID = function(req, res, next, id_shipping_time) {
  var qry = '';
  var qry_callback;
  req.getConnection(function(err, connection) {
    if (err) {
      return next(err);
    }
    qry = 'SELECT ';
    qry += '  st.*, ';
    qry += '  z.id_location ';
    qry += 'FROM ';
    qry += '  shipping_time st ';
    qry += '  JOIN zone z USING(id_zone) ';
    qry += 'WHERE ';
    qry += '  st.id_shipping_time = ? ';
    qry += '; ';
    qry_callback = connection.query(qry, [id_shipping_time], function(err, shipping_time) {
      console.log(qry_callback.sql);
      if (err) {
        return next(err);
      } else if (!shipping_time.length) {
        return res.status(404).send({
          message: 'No se ha encontrado el horario indicado.'
        });
      }

      req.shipping_time = shipping_time[0];
      next();
    });
  });
};

//Horarios habilitados para la entrega para una dada localidad y zona
exports.get_shipping_times = function(req, res) {
  var msg = 'TODO OK';
  var error = false;

  if(req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null) {
    // var id_location = req.query.id_location;
    var id_zone = req.query.id_zone;
    var qry = '';
    var qry_callback ;
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error en getConnection al obtener el horario de entrega para la zona indicada.';
        error = true;
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      qry = 'SELECT st.* FROM shipping_time st ';
      qry += 'JOIN zone z USING(id_zone, id_location) ';
      qry += 'WHERE st.id_status = ? AND st.id_zone = ?;';

      qry_callback = connection.query(qry, [globals.ACTIVO, id_zone], function(err, shipping_time) {
        if(err) {
          msg = 'Error obtener los datos de los horarios de entrega para la zona indicada.';
          console.log(err+':'+msg);
          error = true;
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }
        console.log('------------------Parámetros de basket (get_shipping_times)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Parámetros de basket (get_shipping_times)--------------------');
        res.jsonp(shipping_time);
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

//Todos los horarios de entrega (activos o no) para cualquier localidad y zona
exports.list_shipping_times = function(req, res) {

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
        msg = 'Error obtener el horario de entrega.';
        error = true;
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      var count = req.query.count || 5;
      var page = req.query.page || 1;

      //WHERE.
      var where = 'WHERE st.id_zone = ' + connection.escape(id_zone) + ' ';

      //ORDER BY.
      var order_by = mysql_helper.getOrderBy('st.created', req.query.sorting);

      //LIMIT.
      var rtdo_limit_pag = mysql_helper.getLimitAndPagination(page, count);
      var pagination = rtdo_limit_pag.pagination;
      var limit = rtdo_limit_pag.limit;

      qry += 'SELECT COUNT(*) total_count FROM shipping_time st ';
      qry += '  JOIN status s USING(id_status) ';
    //  qry += '  JOIN user u USING(id_user) ';
      qry += where;
      qry += ';';
      qry += 'SELECT ';
      qry += '  st.*, ';
      qry += '  s.name status_name ';
    //  qry += '  u.display_name, ';
    //  qry += '  CONCAT(u.first_name, " ", u.last_name) user_name ';
      qry += 'FROM ';
      qry += '  shipping_time st ';
      qry += '  JOIN status s USING(id_status) ';
    //  qry += '  JOIN user u USING(id_user) ';
      qry += where;
      qry += order_by;
      qry += limit;
      qry_callback = connection.query(qry, [], function(err, results) {

        console.log('------------------Parámetros de basket (list_shipping_times)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Parámetros de basket (list_shipping_times)--------------------');

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
        var shipping_time = results[1];
        var result = mysql_helper.getResult(shipping_time, total_count, pagination);

        res.jsonp(result);
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

//Agrega un nuevo horario de entrega en una localidad y zona
exports.add_shipping_times = function(req, res) {
  var msg = 'TODO OK';
  var error = false;

  if(req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null) {
    var shipping_hour_from = req.body.shipping_hour_from;
    var shipping_hour_to = req.body.shipping_hour_to;
    var id_user = req.user.id_user;
    var id_location = req.body.id_location;
    var id_zone = req.body.id_zone;
    var id_status = req.body.id_status;

    var qry = '';
    var qry_callback ;
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error agregar el horario de entrega nuevo.';
        error = true;
        console.log(msg + ' '+ err);
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      qry = 'INSERT INTO shipping_time (shipping_hour_from, shipping_hour_to, id_status, id_location, id_zone, id_user_created, modified, id_user_modified) ';
      qry += 'VALUES (?, ?, ?, ?, ?, ?, NOW(), ?); ';
      qry_callback = connection.query(qry, [shipping_hour_from, shipping_hour_to, id_status, id_location, id_zone, id_user, id_user], function(err, shipping_time) {
        if(err) {
          msg = 'Error al agregar un nuevo horario de entrega.';
          error = true;
          console.log(msg + ' '+ err);
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }
        console.log('------------------Parámetros de basket (add_shipping_times)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Parámetros de basket (add_shipping_times)--------------------');
        res.jsonp([shipping_time]);
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

//Actualiza/cambia un horario de entrega existente (id_shipping_time) para una dada localidad y zona
exports.update_shipping_times = function(req, res) {

  var msg = 'TODO OK';
  var error = false;

  if(req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null) {
    var id_user = req.user.id_user;
    var shipping_times = req.body.shipping_times;
    var qry = '';
    var qry_callback = '';

    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error al actualizar el horario de entrega.';
        error = true;
        console.log(msg);
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      var shipping_time_insert = [];
      var now = new Date().toISOString();
      for (var i = 0, len = shipping_times.length; i < len; i++) {
        if (shipping_times[i].id_shipping_time !== null && shipping_times[i].id_shipping_time !== undefined) {
          shipping_time_insert.push([ shipping_times[i].id_shipping_time, shipping_times[i].shipping_hour_from, shipping_times[i].shipping_hour_to, shipping_times[i].id_status, shipping_times[i].id_location, shipping_times[i].id_zone, shipping_times[i].created, shipping_times[i].id_user_created, id_user, now ]);
        }
      }

      qry = 'REPLACE INTO shipping_time ';
      qry += ' (id_shipping_time, shipping_hour_from, shipping_hour_to, id_status, id_location, id_zone, created, id_user_created, id_user_modified, modified) ';
      qry += 'VALUES ? ';

      qry_callback = connection.query(qry, [shipping_time_insert], function(err, shipping_time) {
        if(err) {
          msg = 'Error al actualizar el horario de entrega.';
          error = true;
          console.log(msg+err);
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }

        console.log('------------------Parámetros de basket (update_shipping_times)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Parámetros de basket (update_shipping_times)--------------------');
        res.jsonp([shipping_time]);
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

//Elimina los horarios de entrega para una dada localidad y zona
exports.delete_shipping_times = function(req, res) {

  var msg = 'TODO OK';
  var error = false;

  if(req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null) {
    var id_user = req.user.id_user;
    var shipping_times = req.body.shipping_times;

    var qry = '';
    var qry_callback = '';

    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error al eliminar el horario de entrega.';
        error = true;
        console.log(msg);
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      var shipping_time_delete = [];
      var now = new Date().toISOString();
      for (var i = 0, len = shipping_times.length; i < len; i++) {
        if (shipping_times[i].id_shipping_time !== null && shipping_times[i].id_shipping_time !== undefined) {
          shipping_time_delete.push([ shipping_times[i].id_shipping_time ]);
        }
      }

      qry = 'DELETE FROM shipping_time WHERE id_shipping_time = ?';
      qry_callback = connection.query(qry, [shipping_time_delete], function(err, shipping_time) {
        if(err) {
          msg = 'Error al eliminar el horario de entrega.';
          error = true;
          console.log(msg+err);
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }

        console.log('------------------Parámetros de basket (delete_shipping_times)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Parámetros de basket (delete_shipping_times)--------------------');
        res.jsonp([shipping_time]);
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

function on_off_shipping_time(req, res, habilitar) {
  var msg = 'TODO OK';
  var error = false;

  if(req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null) {
    var id_user = req.user.id_user;
    var shipping_times = req.body.shipping_times;

    var status = globals.NO_ACTIVO;
    if(habilitar) {
      status = globals.ACTIVO;
    }

    var qry = '';
    var qry_callback = '';

    req.getConnection(function(err, connection) {

      if (err) {
        msg = 'Error al habilitar el horario de entrega.';
        error = true;
        console.log(msg);
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      var shipping_time_insert = [];
      var now = new Date().toISOString();
      for (var i = 0, len = shipping_times.length; i < len; i++) {
        if (shipping_times[i].id_shipping_time !== null && shipping_times[i].id_shipping_time !== undefined) {
          shipping_time_insert.push([ status, id_user, shipping_times[i].id_shipping_time, now ]);
        }
      }

      qry = 'INSERT INTO shipping_time (id_status, id_user_modified, id_shipping_time, modified) VALUES ? ';
      qry += 'ON DUPLICATE KEY UPDATE id_status = ?, id_user_modified = ?, modified = ?;';

      qry_callback = connection.query(qry, [shipping_time_insert, status, id_user, now], function(err, shipping_time) {
        if(err) {
          msg = 'Error al habilitar el horario de entrega.';
          error = true;
          console.log(msg+err);
          res.jsonp([{ error: error, msg: msg }]);
          return;
        }

        console.log('------------------Parámetros de basket (on_off_shipping_times)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Parámetros de basket (on_off_shipping_times)--------------------');
        res.jsonp(shipping_time);
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

//Habilita un horario de entrega para que sea ofrecido al cliente (el horario ya tenía que estar cargado)
exports.enable_shipping_times = function(req, res) {
  on_off_shipping_time(req, res, true);
};

//Deshabilita un horario de entrega para que ya no sea ofrecido al cliente
exports.disable_shipping_times = function(req, res) {
  on_off_shipping_time(req, res, false);
};
