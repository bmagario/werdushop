'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  globals = require(path.resolve('.','./config/globals')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  multer = require('multer'),
  config = require(path.resolve('./config/config'));

function validate_address(res, id_location, id_zone, street, number) {
  var msg = 'TODO OK';
  var error = false;

  var qry = '';
  var qry_callback = '';
  if(street !== null && street !== undefined &&
      number !== null && number !== undefined /*&&
      floor !== null && floor !== undefined &&
      apartment !== null && apartment !== undefined*/) {// && verificar si existe esa calle y número y si está dentro de la zona para esa localidad*/
    console.log('//FALTA IMPLEMENTAR CONTROL DE QUE LA DIRECCIÓN SEA VALIDA PARA LA ZONA Y LOCALIDAD');
    return true;
  } else {
    return false;
  }
}

/**
* Calcula la cantidad de direcciones activas para el usuario
*/
function numberOfActiveAddress(res, connection, id_user) {
  var qry = '';
  var qry_callback = '';

  //Armo la query para contar el numero de direcciones activas del usuario
  qry = 'SELECT COUNT(id_user_address) AS cantidad ';
  qry += 'FROM user_address ';
  qry += 'WHERE id_user = ? AND id_status = ? ';
  qry += 'GROUP BY id_user;';

  qry_callback = connection.query(qry, [id_user, globals.ACTIVO], function(err, count) {
    if(err) { 
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    }
    console.log('------------------Address (used_address)--------------------');
    console.log(qry_callback.sql);
    console.log('------------------Address (used_address)--------------------');

    if(count !== null && count !== undefined && count !== [] && count[0] !== null && count[0] !== undefined) {
      console.log(count[0].cantidad);
      return(count[0].cantidad);
    }
    else return(0);
  });
}


/**
* Verifica si la dirección fue empleada en alguna de las canastas cerradas del usuario
*/
function used_address(res, connection, id_user, id_user_address) {
  console.log('====used_address====');
  var qry = '';
  var qry_callback = '';

  //Armo la query para buscar la dirección entre las canastas del usuario
  qry = 'SELECT EXISTS( ';
  qry += '  SELECT id_basket_order ';
  qry += '  FROM basket_order ';
  qry += '  WHERE id_user = ? AND id_user_address = ? AND NOT id_status = ?) AS existe; ';

  qry_callback = connection.query(qry, [id_user, id_user_address, globals.CANASTA_ACTIVA], function(err, exists) {
    if(err) { 
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    }
    console.log('------------------Address (used_address)--------------------');
    console.log(qry_callback.sql);
    console.log('------------------Address (used_address)--------------------');
   
  // console.log('____________'+exists[0].existe>0);
    if(exists !== null) { return(exists[0].existe>0); }
    else return(false);
  });
}

/**
* Verifica si la dirección fue empleada en alguna de las canastas activas del usuario
*/
function used_on_open_basket(res, connection, id_user, id_user_address) {
  var qry = '';
  var qry_callback = '';

  //Armo la query para buscar la dirección entre las canastas activas del usuario
  qry = 'SELECT EXISTS( ';
  qry += '  SELECT id_basket_order ';
  qry += '  FROM basket_order ';
  qry += '  WHERE id_user = ? AND id_user_address = ? AND id_status = ?) AS existe; ';

  qry_callback = connection.query(qry, [id_user, id_user_address, globals.CANASTA_ACTIVA], function(err, exists) {
    if(err) { 
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    }
    console.log('------------------Address (used_on_open_basket)--------------------');
    console.log(qry_callback.sql);
    console.log('------------------Address (used_on_open_basket)--------------------');
   
    if(exists !== null) { return(exists[0].existe>0); }
    else return(false);
  });
}

/**
* Add a new User Address
*/
function add_new_address(res, connection, id_location, id_zone, street, number, floor, apartment, id_user) {
  console.log('add_new_address');

  var qry = '';
  var qry_callback = '';

  //Armo la query para cargar la dirección
  qry = 'INSERT INTO user_address ';
  qry += '  (id_user, id_location, id_zone, street, number, floor, apartment, id_status) ';
  qry += 'VALUES ';
  qry += '  (?, ?, ?, ?, ?, ?, ?, ?) ;';
  qry_callback = connection.query(qry, [id_user, id_location, id_zone, street, number, floor, apartment, globals.ACTIVO], function(err, user_address) {
    if(err) {
      console.log(err);
     // console.log(qry_callback);
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    }
    //console.log([address]);
    console.log('------------------Address (add_new_address)--------------------');
    console.log(qry_callback.sql);
    console.log('------------------Address (add_new_address)--------------------');
    res.jsonp([user_address]);
   // return;

  });
}

/**
* Cambia el estado de la dirección a NO_ACTIVA
*/
function deactivate_address(res, connection, id_user_address, id_user) {
  var qry = '';
  var qry_callback = '';
    
  //Armo la query para cambiar estado (inhabilitar) direccion anterior
  qry = 'UPDATE user_address ua ';          
  qry += 'SET ua.id_status = ? ';
  qry += 'WHERE ua.id_user = ? AND ua.id_user_address = ?;';
  qry_callback = connection.query(qry, [globals.NO_ACTIVO, id_user, id_user_address], function(err, user_address) {
    if(err) { 
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    }
    console.log('------------------Datos de dirección (updateAddress)--------------------');
    console.log(qry_callback.sql);
    console.log('------------------Datos de dirección (updateAddress)--------------------');
    res.jsonp([user_address]);
  //  return;
  // return([address]);
  });
}

/**
* Get a User Address
*/
exports.get_address = function (req, res) {
  var msg = 'TODO OK';
  var error = false;

  if(req.user !== undefined && req.user !== null) {

    req.getConnection(function(err, connection) {
      if(err) { 
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      }

      var id_user = req.user.id_user;
      var qry = '';
      var qry_callback = '';

      qry = 'SELECT * ';
      qry += 'FROM user_address ';
      qry += 'WHERE id_user = ? AND id_status = ?; ';

      qry_callback = connection.query(qry, [id_user, globals.ACTIVO], function(err, user_address) {
        if(err) { 
          return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
        }
        console.log('------------------Direcciones activas (get_address)--------------------');
        console.log(qry_callback.sql);
        console.log('------------------Direcciones activas (get_address)--------------------');

        res.jsonp(user_address);
      });
    });//getConnection
  }
};

/**
* Remove a User Address
*/
exports.remove_address = function (req, res) { 
  console.log('CAS002>Controller ADDRESS remove_address: ');
  if(req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null) {
    var id_user_address = req.body.id_user_address;
    var id_user = req.user.id_user;
    var msg = 'TODO OK';
    var error = false;
    req.getConnection(function(err, connection) {
      if(err) {
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      }
      if(id_user_address !== undefined && id_user_address !== null &&
          id_user !== undefined && id_user !== null){ 
        if(used_address(res, connection, id_user, id_user_address)) {
          console.log('Usa esa dirección en una canasta');
            //Deshabilito esa dirección
          deactivate_address(res, connection, id_user_address, id_user);
        } else {  //Si no la utilizó nunca, la borro de la BD
          console.log('No usó esa dirección en una canasta entregada/cerrada, etc');
          var qry = '';
          var qry_callback = '';

          if(used_on_open_basket(res, connection, id_user, id_user_address)){
            console.log('Tiene la dirección cargada en una canasta abierta.');
            qry = 'UPDATE basket_order bo ';
            qry += 'SET bo.id_user_address = NULL, ';
            qry += 'WHERE bo.id_basket_order = ? AND id_user = ?;';
            qry_callback = connection.query(qry, [id_user_address, id_user], function(err, address) {
              if(err) {
                console.log(err);
                return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
              }
              console.log('------------------Colocar en NULL la referencia de basket al id_user_address (remove_address)--------------------');
              console.log(qry_callback.sql);
              console.log('------------------Colocar en NULL la referencia de basket al id_user_address (remove_address)--------------------');
              res.jsonp([address]);

            });//connection query
          }
          qry = '';
          qry_callback = '';
          qry += 'DELETE FROM user_address ';
          qry += 'WHERE id_user_address = ? AND id_user = ?;';
          qry_callback = connection.query(qry, [id_user_address, id_user], function(err, address) {
            if(err) {
              console.log(err);
              return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
            }
            console.log('------------------Eliminar dirección de usuario (remove_address)--------------------');
            console.log(qry_callback.sql);
            console.log('------------------Eliminar dirección de usuario (remove_address)--------------------');
            res.jsonp([address]);
          });//connection query
        }
      }
    });//get connection 
  } else {
    console.log ('Sucedió un error al recibir los parámetros.');
    return;
  }
};

/**
* Update a User Address
*/
exports.update_address = function (req, res) {
  console.log('CAS001>Controller ADDRESS update_address: '); 
  var msg = 'TODO OK';
  var error = false;
  var qry = '';
  var qry_callback = '';
  if(req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null) {
    var id_user_address = req.body.id_user_address;
    var id_user = req.user.id_user;
    var id_location = req.body.id_location;//globals.LOCATIONS.BAHIA_BLANCA
    var id_zone = req.body.id_zone;
    var street = req.body.street;
    var number = req.body.number;
    var floor = req.body.floor;
    var apartment = req.body.apartment;
 
    req.getConnection(function(err, connection) { 
      if(err) { 
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      }
      //Verifico si la dirección enviada es válida
      if(validate_address(res, id_location, id_zone, street, number, floor, apartment)) {   
        //Si se intenta modificar una dirección exitente, id_user_address tendrá un valor asignado
        if(id_user_address !== null && id_user_address !== undefined) {
          console.log('acaaaa'+id_user_address);
          //Verifico si la dirección a modificar fue usada en alguna de las canastas
          if(used_address(res, connection, id_user, id_user_address)) {
            //Deshabilito esa dirección
            deactivate_address(res, connection, id_user_address, id_user);
            //La cargo como una nueva con los datos modificados, para no perder trazabilidad en los pedidos
            add_new_address(res, connection, id_location, id_zone, street, number, floor, apartment, id_user);
          } else{
            //La dirección todavia no se usó, la cambio con los nuevos datos
            qry = '';
            qry_callback = '';     
            //Actualizar datos
            qry = 'UPDATE user_address ua ';          
            qry += 'SET ';
            qry += '  ua.id_location = ?, ';
            qry += '  ua.id_zone = ?, ';
            qry += '  ua.street = ?, ';
            qry += '  ua.number = ?, ';
            qry += '  ua.floor = ?, ';
            qry += '  ua.apartment = ?, ';
            qry += '  ua.id_status = ? ';
            qry += 'WHERE ';
            qry += '  ua.id_user = ? AND ua.id_user_address = ?;';
            qry_callback = connection.query(qry, [id_location, id_zone, street, number, floor, apartment, globals.ACTIVO, id_user, id_user_address], function(err, address) {
              if(err) { 
                return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
              }
              console.log('------------------Datos de dirección (updateAddress)--------------------');
              console.log(qry_callback.sql);
              console.log('------------------Datos de dirección (updateAddress)--------------------');
              res.jsonp([address]);
            });//connection query   
          }//else dirección utilizada
        } else {  //Dirección nueva
         // var count = numberOfActiveAddress(res, connection, id_user);
          var count = 0;
          qry = '';
          qry_callback = '';
          //Armo la query para contar el numero de direcciones activas del usuario
          qry = 'SELECT COUNT(id_user_address) AS cantidad ';
          qry += 'FROM user_address ';
          qry += 'WHERE id_user = ? AND id_status = ? ';
          qry += 'GROUP BY id_user;';
          qry_callback = connection.query(qry, [id_user, globals.ACTIVO], function(err, count) {
            if(err) { 
              return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
            }
            console.log('------------------Address (used_address)--------------------');
            console.log(qry_callback.sql);
            console.log('------------------Address (used_address)--------------------');
            console.log(count);
            //Como máximo puede tener globals.CANTIDAD_MAX_DIRECCIONES direcciones activas
            if(count === null || count === undefined || count === [] || count[0] === null || count[0] === undefined || count[0].cantidad < globals.CANTIDAD_MAX_DIRECCIONES) {
              //Agrego la nueva dirección
              add_new_address(res, connection, id_location, id_zone, street, number, floor, apartment, id_user);
            } else {
              error = true;
              msg = 'Puede almacener como máximo dos direcciones. Para cargar una nueva, debe modificar/eliminar una de las existentes.';
              console.log (msg);
              res.jsonp([{ error: error, msg: msg }]);
              return;
            } //amount_address
          });
        } //Dirección nueva
      } else {//if dirección valida
        error = true;
        msg = 'Sucedió un error al recibir los parámetros o bien la dirección no es válida para la zona / localidad.';
        console.log (msg);
        res.jsonp([{ error: error, msg: msg }]);
        return;
      }//else dirección valida
    });//get connection
  } else { //if req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null
    error = true;
    msg = 'El usuario no está logueado o bien sucedió un error al recibir los parámetros.';
    console.log (msg);
    res.jsonp([{ error: error, msg: msg }]);
    return;
  } //else req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null
};