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
* CONDICIONES DE ENTREGA: COSTO ENVIO/COSTO COMPRA MINIMA/COSTO MINIMO DE COMPRA PARA ENTREGA GRATIS
*/
/**
 * Se obtienen los costos asociados al envio.
 * @param  {[type]}   req               [description]
 * @param  {[type]}   res               [description]
 * @param  {Function} next              [description]
 * @param  {[type]}   id_shipping_cost  [description]
 * @return {[type]}                     [description]
 */
exports.shippingCostsByID = function(req, res, next, id_shipping_cost) {
  var qry = '';
  var qry_callback;
  req.getConnection(function(err, connection) {
    if (err) {
      return next(err);
    }
    qry = 'SELECT ';
    qry += '  sc.*, ';
    qry += '  z.id_location ';
    qry += 'FROM ';
    qry += '  shipping_conditions sc ';
    qry += '  JOIN zone z USING(id_zone) ';
    qry += 'WHERE ';
    qry += '  sc.id_shipping_cost = ? ';
    qry += '; ';
    qry_callback = connection.query(qry, [id_shipping_cost], function(err, shipping_conditions) {
      console.log(qry_callback.sql);
      if (err) {
        return next(err);
      } else if (!shipping_conditions.length) {
        return res.status(404).send({
          message: 'No se ha encontrado el día indicado.'
        });
      }

      req.shipping_conditions = shipping_conditions[0];
      next();
    });
  });
};

//Condiciones de entrega: costo de envio, costo de compra mínima, costo de compra para entrega gratuita
exports.get_shipping_conditions = function(req, res) {
  var msg = 'TODO OK';
  var error = false;

  if(req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null) {
    var id_location = req.query.id_location;
    var id_zone = req.query.id_zone;
    
    var qry = '';
    var qry_callback ;
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error obtener las condiciones de entrega para la localidad y zona indicada.';
        console.log(msg+err);
        error = true;
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }

      qry = 'SELECT sc.* FROM shipping_conditions sc ';
      qry += 'JOIN zone z USING(id_zone, id_location) ';
      qry += 'WHERE sc.id_zone = ? AND sc.id_location = ?;';
      qry_callback = connection.query(qry, [id_zone, id_location], function(err, shipping_conditions) {
        if(err) {
          msg = 'Error obtener los datos de las condiciones de entrega para la localidad y zona indicada.';
          error = true;
          console.log(msg+err);
          return connection.rollback(function() { res.jsonp([{ error: error, msg: msg }]); });
        }
        console.log('------------------Parámetros de basket (get_shipping_conditions)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Parámetros de basket (get_shipping_conditions)--------------------');
        res.jsonp(shipping_conditions);
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

exports.list_shipping_costs = function(req, res) {

  if(req.query.id_zone === undefined || req.query.id_zone === null){
    return res.status(400).send({ message: 'Debe ingresar la localidad.' });
  }

  var msg = 'TODO OK';
  var error = false;
  var id_location = req.query.id_location;
  var id_zone = req.query.id_zone;
  var qry = '';
  var qry_callback ;
  
  if(req.user !== undefined && req.user !== null) {

    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error obtener los costos asociados a la entrega.';
        error = true;
        console.log(msg+err);
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }
      
      qry += 'SELECT sc.* FROM shipping_conditions sc ';
      qry += 'JOIN zone z USING(id_zone) ';
      qry += 'WHERE sc.id_zone = ? AND sc.id_location = ?';
      qry += ';';
      qry_callback = connection.query(qry, [id_zone, id_location], function(err, shipping_conditions) {
   
        console.log('------------------Parámetros de basket (list_shipping_costs)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Parámetros de basket (list_shipping_costs)--------------------');
        console.log(shipping_conditions);

        if (err) {
          return res.status(400).send({
            message: errorHandler.getErrorMessage(err)
          });
        }

        res.jsonp(shipping_conditions);
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

//Actualiza/cambia los costos asociados a la entrega (id_shipping_conditions) para una dada localidad y zona
exports.update_shipping_costs = function(req, res) {

  var msg = 'TODO OK';
  var error = false;
  
  if(req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null) {
    var id_user = req.user.id_user;
    var id_shipping_conditions = req.body.id_shipping_conditions;
    var id_zone = req.body.id_zone;
    var id_location = req.body.id_location;
    var shipping_cost = req.body.shipping_cost;
    var free_shipping = req.body.free_shipping;
    var minimun_purchase = req.body.minimun_purchase;

    var qry = '';
    var qry_callback ;
    req.getConnection(function(err, connection) {
      if (err) {
        msg = 'Error al actualizar el los costos de la entrega.';
        error = true;
        console.log(msg+err);
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }
      
      qry = 'INSERT INTO shipping_conditions ';
      qry += '  (id_shipping_conditions, shipping_cost, free_shipping, minimun_purchase, id_location, id_zone, id_user_created, modified, id_user_modified) ';
      qry += 'VALUES ';
      qry += '  (?, ?, ?, ?, ?, ?, ?, NOW(), ?) ';
      qry += 'ON DUPLICATE KEY UPDATE ';
      qry += '  shipping_cost = ?, free_shipping = ?, minimun_purchase = ?, modified = NOW(), id_user_modified = ?';

      qry_callback = connection.query(qry, [id_shipping_conditions, shipping_cost, free_shipping, minimun_purchase, id_location, id_zone, id_user, id_user, shipping_cost, free_shipping, minimun_purchase, id_user], function(err, shipping_conditions) {
        if(err) {
          msg = 'Error al actualizar los costos de las entregas.';
          error = true;
          console.log(msg+err);
          return connection.rollback(function() { res.jsonp([{ error: error, msg: msg }]); });
        }
        console.log('------------------Parámetros de basket (update_shipping_costs)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Parámetros de basket (update_shipping_costs)--------------------');
        res.jsonp([shipping_conditions]);
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