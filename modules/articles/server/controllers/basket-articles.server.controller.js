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



function get_basket (res, connection, id_basket_order, id_location, basket_order) {
  var qry = '';
  var qry_callback = '';
  var parametros = [];

  //Se obtienen los precios de los articulos simples.
  qry = 'DROP TEMPORARY TABLE if EXISTS tmp_price_date; ';
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

  qry += 'DROP TEMPORARY TABLE if EXISTS tmp_price; ';
  qry += 'CREATE TEMPORARY TABLE tmp_price ';
  qry += 'SELECT ';
  qry += '  p.* ';
  qry += 'FROM ';
  qry += '  price p ';
  qry += '  JOIN tmp_price_date tpd ON(tpd.id_article = p.id_article AND tpd.created = p.created) ';
  qry += 'WHERE ';
  qry += '  p.id_location = ?; ';
  parametros.push(id_location);
  
  //Se obtienen los precios de los articulos complejos.
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
  
  qry_callback = connection.query(qry, parametros, function(err, result) {
    if(err) {
      console.log(err);
      return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
    }
    qry = '';
    parametros = [];

    qry += 'SELECT ';
    qry += '  a.id_article, ';
    qry += '  NULL id_complex_article, ';
    qry += '  ? tipo, ';
    qry += '  a.color, ';
    qry += '  a.name, ';
    qry += '  a.article_image_url, ';
    qry += '  a.scale, ';
    qry += '  mu.abbreviation measurement_unit_abbreviation, ';
    qry += '  mu.abbreviation_plural measurement_unit_abbreviation_plural, ';
    qry += '  mue.name measurement_unit_equivalence_name, ';
    qry += '  a.show_equivalence, ';
    qry += '  a.equivalence, ';
    qry += '  mu.name measurement_unit_name, ';
    qry += '  mue.abbreviation measurement_unit_equivalence_abbreviation, ';
    qry += '  mue.abbreviation_plural measurement_unit_equivalence_abbreviation_plural, ';
    qry += '  g.name group_name, ';
    qry += '  b.name brand_name, ';
    qry += '  sg.name subgroup_name, ';
    qry += '  CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0), "", LPAD(a.code, 3, 0)) full_code, ';
    qry += '  p.coeficient, ';
    qry += '  p.price, ';
    qry += '  p.offer, ';
    qry += '  p.season, ';
    qry += '  p.quality, ';
    qry += '  p.impulse, ';
    qry += '  c.amount ';
    qry += 'FROM ';
    qry += '  basket c ';
    qry += '  JOIN article a USING(id_article) ';
    qry += '  JOIN measurement_unit mu ON(mu.id_measurement_unit = a.id_measurement_unit) ';
    qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
    qry += '  JOIN subgroup sg USING(id_subgroup) ';
    qry += '  JOIN grupo g USING(id_group) ';
    qry += '  JOIN article_location al USING(id_article) ';
    qry += '  JOIN tmp_price p USING(id_article) ';
    qry += '  LEFT JOIN brand b USING(id_brand) ';
    qry += 'WHERE ';
    qry += '  c.id_basket_order = ? ';
    qry += '  AND al.id_location = ? ';
    qry += 'UNION ';
    qry += 'SELECT ';
    qry += '  NULL id_article, ';
    qry += '  a.id_complex_article, ';
    qry += '  ? tipo, ';
    qry += '  "" color, ';
    qry += '  a.name, ';
    qry += '  a.article_image_url, ';
    qry += '  "" scale, ';
    qry += '  "" measurement_unit_abbreviation, ';
    qry += '  "" measurement_unit_abbreviation_plural, ';
    qry += '  "" measurement_unit_equivalence_name, ';
    qry += '  "" show_equivalence, ';
    qry += '  "" equivalence, ';
    qry += '  "" measurement_unit_name, ';
    qry += '  "" measurement_unit_equivalence_abbreviation, ';
    qry += '  "" measurement_unit_equivalence_abbreviation_plural, ';
    qry += '  g.name group_name, ';
    qry += '  "" brand_name, ';
    qry += '  sg.name subgroup_name, ';
    qry += '  CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0), "", LPAD(a.code, 8, 0)) full_code, ';
    qry += '  p.coeficient, ';
    qry += '  p.price, ';
    qry += '  p.offer, ';
    qry += '  p.season, ';
    qry += '  p.quality, ';
    qry += '  p.impulse, ';
    qry += '  c.amount ';
    qry += 'FROM ';
    qry += '  basket c ';
    qry += '  JOIN complex_article a USING(id_complex_article) ';
    qry += '  JOIN subgroup sg USING(id_subgroup) ';
    qry += '  JOIN grupo g USING(id_group) ';
    qry += '  JOIN complex_article_location al USING(id_complex_article) ';
    qry += '  JOIN tmp_price_complex p USING(id_complex_article) '; 
    qry += 'WHERE ';
    qry += '  c.id_basket_order = ? ';
    qry += '  AND al.id_location = ? ';
    qry += 'ORDER BY tipo, name;';
    parametros.push(globals.ARTICULO_SIMPLE);
    parametros.push(id_basket_order);
    parametros.push(id_location);
    parametros.push(globals.ARTICULO_COMPLEJO);
    parametros.push(id_basket_order);
    parametros.push(id_location);

    qry_callback = connection.query(qry, parametros, function(err, basket) {
      if(err) {
        console.log(err);
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      }

      console.log('------------------Articulos de basket (list_basket)--------------------');
      console.log(qry_callback.sql);
      console.log('------------------Articulos de basket (list_basket)--------------------');
      res.jsonp([{ cabecera: basket_order, articulos: basket }]);
    });
  });
}

exports.list_basket = function(req, res) {
  console.log('CBS002>Controller BASKET list_basket: ');

  if(req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null) {//el usuario está logueado

    req.getConnection(function(err, connection) {
      if(err) {
        console.log(err);
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      }

      var id_user = req.user.id_user;
      
      var id_location = globals.LOCATIONS.BAHIA_BLANCA; //req.body.id_location;//globals.LOCATIONS.BAHIA_BLANCA;
      var qry = '';
      var qry_callback = '';

      //Si tengo el id_basket_order guardado en la sesión, lo uso
      if(req.session !== undefined && req.session !== null && req.session.id_basket_order !== undefined && req.session.id_basket_order !== null) {
        var id_basket_order = req.session.id_basket_order;
        qry = 'SELECT * ';
        qry += 'FROM basket_order ';
        qry += 'WHERE id_basket_order = ? AND id_user = ? AND id_location = ? AND id_status = ? ';
        qry += 'ORDER BY created DESC LIMIT 1; ';
        qry_callback = connection.query(qry, [id_basket_order, id_user, id_location, globals.CANASTA_ACTIVA], function(err, basket_order) {
          if(err) {
            console.log(err);
            return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
          }

          console.log('------------------Cabecera de basket: req.session.id_basket_order (list_basket)--------------------');
          console.log(qry_callback.sql);
          console.log('------------------Cabecera de basket: req.session.id_basket_order (list_basket)--------------------');

          if(!basket_order.length){
            req.session.id_basket_order = null;
            res.jsonp([{ cabecera:{}, articulos:[] }]);
            return;
          }

          get_basket (res, connection, id_basket_order, id_location, basket_order[0]);
        });
      } else {
        //Obtengo la canasta abierta del usuario para la ubicación
        //1-Cabecera de Basket
        qry = 'SELECT * ';
        qry += 'FROM basket_order ';
        qry += 'WHERE id_user = ? AND id_location = ? AND id_status = ? ';
        qry += 'ORDER BY created DESC LIMIT 1 ';

        qry_callback = connection.query(qry, [id_user, id_location, globals.CANASTA_ACTIVA], function(err, basket_order) {
          if(err) {
            console.log(err);
            return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
          }

          if(!basket_order.length){
            req.session.id_basket_order = null;
            res.jsonp([{ cabecera:{}, articulos:[] }]);
            return;
          }

          console.log('------------------Cabecera de basket: no tengo id_basket_order en la session (list_basket)--------------------');
          console.log(qry_callback.sql);
          console.log('------------------Cabecera de basket no tengo id_basket_order en la session (list_basket)--------------------');

          //2-Artículos de Basket
          //Obtener los articulos para almacenarlos en basket y los precios actuales de cada artículo
          var id_basket_order = basket_order[0].id_basket_order;
          req.session.id_basket_order = id_basket_order;
          get_basket (res, connection, id_basket_order, id_location, basket_order[0]);
        });
      }
    });
  } else {  //el usuario no está logueado
    res.jsonp([{ cabecera:{}, articulos:[] }]);
    return;
  }
};

exports.add_article = function(req, res) {
  console.log('CBS003>Controller BASKET add_article: ');

  var msg = 'TODO OK';
  var error = false;

  if(req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null) {

    req.getConnection(function(err, connection) {
      if(err) {
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      }

      var id_basket_order = null;
      var id_user = req.user.id_user;
      var id_location = req.body.id_location;
      
      var id_article = req.body.id_article;
      var id_complex_article = req.body.id_complex_article;

      var amount = req.body.amount;

      //Si tengo el id_basket_order guardado en la sesión, lo uso
      if(req.session !== undefined && req.session !== null && req.session.id_basket_order !== undefined && req.session.id_basket_order !== null) {
        id_basket_order = req.session.id_basket_order;
      }

      var qry = '';
      var qry_callback = '';

      if(id_basket_order === undefined || id_basket_order === null){ //El usuario no tiene ninguna canasta abierta

        //Armo la query para crear la cabecera de la canasta
        qry = 'INSERT INTO basket_order (id_user, id_location, id_status, id_user_created, modified, id_user_modified) ';
        qry += 'VALUES (?, ?, ?, ?, NOW(), ?); ';
        qry_callback = connection.query(qry, [id_user, id_location, globals.CANASTA_ACTIVA, id_user, id_user], function(err, basket_order) {
          if(err) {
            msg = 'Error al crear la cabecera de la canasta.';
            error = true;
            console.log(err+msg);
            res.jsonp([{ error: error, msg: msg }]);
            return;
          }
          console.log('------------------Cabecera de basket: NO tiene una canasta abierta (add_article)--------------------');
          console.log(qry_callback.sql);
          console.log('------------------Cabecera de basket: NO tiene una canasta abierta (add_article)--------------------');
          //Obtendo el id de la cabecera (basket_order) recién generado para vincularlo a la lista de articulos (basket)
          id_basket_order = basket_order.insertId;
          qry_callback = '';

          //Armo la query para agregar amount unidades del nuevo art. en la lista de articulos de la canasta.
          //Si ya estaba incluido, incremento en amount unidades
          qry = 'INSERT INTO basket ';
          qry += '  (id_basket_order, id_article, id_complex_article, amount, id_user_created, modified, id_user_modified) ';
          qry += 'VALUES ';
          qry += '  (?, ?, ?, ?, ?, NOW(), ?) ';
          qry += 'ON DUPLICATE KEY UPDATE ';
          qry += '  amount = amount + ?, modified = NOW(), id_user_modified = ?';

          qry_callback = connection.query(qry, [id_basket_order, id_article, id_complex_article, amount, id_user, id_user, amount, id_user], function(err, basket) {
            if(err) {
              msg = 'Error al agregar artículo en la canasta.';
              console.log(msg);
              error = true;
              res.jsonp([{ error: error, msg: msg }]);
              return;
            }

            console.log('------------------Articulos de basket: NO tiene una canasta abierta (add_article)--------------------');
            console.log(qry_callback.sql);
            console.log('------------------Articulos de basket: NO tiene una canasta abierta (add_article)--------------------');

            req.session.id_basket_order = id_basket_order;
            get_basket (res, connection, id_basket_order, id_location, basket[0]);
          });//connection query
        });
      } //if id_basket_order = null / undefined
      else {//si tiene una canasta abierta, agrego el artículo

        qry = 'INSERT INTO basket ';
        qry += '  (id_basket_order, id_article, id_complex_article, amount, id_user_created, modified, id_user_modified) ';
        qry += 'VALUES ';
        qry += '  (?, ?, ?, ?, ?, NOW(), ?) ';
        qry += 'ON DUPLICATE KEY UPDATE ';
        qry += '  amount = amount + ?, modified = NOW(), id_user_modified = ?';

        qry_callback = connection.query(qry, [id_basket_order, id_article, id_complex_article, amount, id_user, id_user, amount, id_user], function(err, basket) {
          if(err) {
            msg = 'Error al agregar artículo en la canasta.';
            error = true;
            console.log(msg+': '+err);
            res.jsonp([{ error: error, msg: msg }]);
            return;
          }
          console.log('------------------Articulos de basket: tiene una canasta abierta (add_article)--------------------');
          console.log(qry_callback.sql);
          console.log('------------------Articulos de basket: tiene una canasta abierta (add_article)--------------------');
          get_basket (res, connection, id_basket_order, id_location, basket[0]);
        });//connection query
      }//else

    });//get connection
  } else {
    error = true;
    msg = 'El usuario no está logueado o bien sucedió un error al recibir los parámetros.';
    console.log (msg);
    res.jsonp([{ error: error, msg: msg }]);
  }
};

exports.sub_article = function(req, res) {
  console.log('CBS004>Controller BASKET sub_article: ');
  
  var msg = 'TODO OK';
  var error = false;
  
  if(req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null) {


    req.getConnection(function(err, connection) {
      if(err) {
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      }
      
      var id_basket_order = null;
      var id_user = req.user.id_user;
      var id_location = req.body.id_location;
     
      var id_article = req.body.id_article;
      var id_complex_article = req.body.id_complex_article;
      var amount = req.body.amount;
      
      //Si tengo el id_basket_order guardado en la sesión, lo uso
      if(req.session !== undefined && req.session !== null && req.session.id_basket_order !== undefined && req.session.id_basket_order !== null) {
        id_basket_order = req.session.id_basket_order;
      }

      if(id_basket_order !== undefined || id_basket_order !== null){ //El usuario tiene una canasta abierta

        connection.beginTransaction(function(err) {
          if (err) {
            msg = 'Error al cerrar la eliminar un artículo.';
            error = true;
            res.jsonp([{ error: error, msg: msg }]);
            return;
          }
          var qry = '';
          var qry_callback = '';
          qry = 'UPDATE basket ';
          qry += 'SET amount = (amount - ?), modified = NOW(), id_user_modified = ? ';
          qry += 'WHERE id_basket_order = ? AND (id_article = ? OR id_complex_article = ?) AND (amount > ?); ';

          qry_callback = connection.query(qry, [amount, id_user, id_basket_order, id_article, id_complex_article, amount], function(err, basket) {

            if(err) {
              msg = 'Error al restar el artículo de la canasta.';
              error = true;
              return connection.rollback(function() {
                res.jsonp([{ error: error, msg: msg }]);
                return;
              });
            }

            console.log('------------------Articulos de basket-actualiza amount (sub_article)--------------------');
            console.log(qry_callback.sql);
            console.log('------------------Articulos de basket-actualiza amount (sub_article)--------------------');

            qry = '';
            qry_callback = '';
            qry += 'DELETE FROM basket WHERE id_basket_order = ? AND (id_article = ? OR id_complex_article = ?) AND (amount <= ?) ';
            qry_callback = connection.query(qry, [id_basket_order, id_article, id_complex_article, amount], function(err, basket) {

              if(err) {
                msg = 'Error al eliminar el artículo de la canasta.';
                error = true;
                return connection.rollback(function() {
                  res.jsonp([{ error: error, msg: msg }]);
                  return;
                });
              }
              connection.commit(function(err) {
                if (err) {
                  msg = 'Error al eliminar un articulo.';
                  error = true;
                  return connection.rollback(function() {
                    res.jsonp([{ error: error, msg: msg }]);
                    return;
                  });
                }
                console.log('------------------Articulos de basket (sub_article)--------------------');
                console.log(qry_callback.sql);
                console.log('------------------Articulos de basket (sub_article)--------------------');
                get_basket (res, connection, id_basket_order, id_location, basket[0]);
              }); //connection.commit
            });//connection query DELETE
          });//connection query UPDATE
        });//connection.beginTransaction

      } //if id_basket_order !== null / undefined
    });//get connection
  } else {
    msg = 'Sucedió un error al recibir los parámetros.';
    console.log (msg);
    error = true;
    res.jsonp([{ error: error, msg: msg }]);
    return;
  }
};

exports.remove_article = function(req, res) {
  console.log('CBS005>Controller BASKET remove_article: ');
  
  var msg = 'TODO OK';
  var error = false;
  
  if(req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null) {

    req.getConnection(function(err, connection) {
      if(err) {
        return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
      }

      var id_basket_order = null;
      var id_location = req.body.id_location;
      
      var id_article = req.body.id_article;
      var id_complex_article = req.body.id_complex_article;

      //Si tengo el id_basket_order guardado en la sesión, lo uso
      if(req.session !== undefined && req.session !== null && req.session.id_basket_order !== undefined && req.session.id_basket_order !== null) {
        id_basket_order = req.session.id_basket_order;
      }

      if(id_basket_order !== undefined || id_basket_order !== null){ //El usuario tiene una canasta abierta

        var qry = '';
        var qry_callback = '';
        qry += 'DELETE FROM basket WHERE id_basket_order = ? AND (id_article = ? OR id_complex_article = ?)';
        qry_callback = connection.query(qry, [id_basket_order, id_article, id_complex_article], function(err, basket) {

          if(err) {
            return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
          }
          console.log('------------------Articulos de basket (sub_article)--------------------');
          console.log(qry_callback.sql);
          console.log('------------------Articulos de basket (sub_article)--------------------');
          get_basket (res, connection, id_basket_order, id_location, basket[0]);
        });//connection query
      } //ifid_basket_order !== null / undefined
    });//get connection
  } else {
    msg = 'Sucedió un error al recibir los parámetros.';
    console.log (msg);
    error = true;
    res.jsonp([{ error: error, msg: msg }]);
    return;
  }
};

function update_articles_information_to_close (res, connection, id_basket_order, id_user_modified) {
  /*
    Graba los datos de equivalencias, escalas, id de las unidades de equivalencia,y el id de medida de cada articulo 
    simple de la canasta al momento del cierre
  */
  var msg = 'TODO OK';
  var error = false;

  
  var qry = '';
  var qry_callback = '';

  //Armo la query para actualizar los datos   
  qry += 'UPDATE ';
  qry += '  basket c  ';
  qry += '  JOIN article a USING(id_article) ';
  qry += 'SET ';
  qry += '  c.equivalence = a.equivalence, ';
  qry += '  c.id_measurement_unit_equivalence = a.id_measurement_unit_equivalence, ';
  qry += '  c.scale = a.scale,  ';
  qry += '  c.id_measurement_unit = a.id_measurement_unit, ';
  qry += '  c.modified = NOW(),  ';
  qry += '  c.id_user_modified = ? ';
  qry += 'WHERE ';
  qry += '  c.id_basket_order = ?; ';  

  qry_callback = connection.query(qry, [id_user_modified, id_basket_order], function(err, basket) {
    if(err) {
      msg = 'Error al cargar los datos de los articulos al cerrar la canasta.';
      error = true;
      console.log(msg+': '+err);
      res.jsonp([{ error: error, msg: msg }]);
      return;
    }
    console.log('------------------Datos de articulos de basket (update_articles_information_to_close)--------------------');
    console.log(qry_callback.sql);
    console.log('------------------Datos de articulos de basket (update_articles_information_to_close)--------------------');
  });//connection query
}

exports.close_basket = function(req, res) {

  /*Cierra la canasta. 
    Graba los siguientes datos:
      - Precios de los artículos (los más recientes)
      - Datos de entrega: fecha y horario de entrega al momento del cierre
      - Unidades de equivalencia, equivalencias, escalas y el ID_MEDIDA del momento del cierre
      - Numero de orden de entrega (buscar > # de las OE de la zona y cargar a la canasta ese valor + 1) 
  */

  var msg = 'TODO OK';
  var error = false;

  if(req.user !== undefined && req.user !== null && req.body !== undefined && req.body !== null && req.session !== undefined && req.session !== null && req.session.id_basket_order !== undefined && req.session.id_basket_order !== null){

    var id_basket_order = req.session.id_basket_order;
    var id_user = req.user.id_user;
    var id_location = req.body.id_location;
    var id_zone = req.body.id_zone;
    var user_address = req.body.user_address;
    var observation = req.body.observation;
    var date_basket = req.body.date_basket;
    var id_hour = req.body.id_hour;

    var qry = '';
    var qry_callback = '';
    
    
    if(user_address !== null && user_address !== undefined && id_hour !== null && id_hour !== undefined && date_basket !== null && date_basket !== undefined){
  
      req.getConnection(function(err, connection) {
        if(err) {
          return res.status(400).send({ message: errorHandler.getErrorMessage(err) });
        }

        connection.beginTransaction(function(err) {
       
          if(id_basket_order !== undefined || id_basket_order !== null) {
            
            update_articles_information_to_close(res, connection, id_basket_order, id_user);

            var parametros = [];         

            //Se actualizan los precios de los articulos SIMPLES  tomando el precio más recientes.
            qry = 'DROP TEMPORARY TABLE if EXISTS tmp_price_date; ';
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

            qry += 'DROP TEMPORARY TABLE if EXISTS tmp_price; ';
            qry += 'CREATE TEMPORARY TABLE tmp_price ';
            qry += 'SELECT ';
            qry += '  p.* ';
            qry += 'FROM ';
            qry += '  price p ';
            qry += '  JOIN tmp_price_date tpd ON(tpd.id_article = p.id_article AND tpd.created = p.created) ';
            qry += 'WHERE ';
            qry += '  p.id_location = ?; ';
            parametros.push(id_location);

            qry += 'UPDATE ';
            qry += '  basket b  ';
            qry += '  JOIN tmp_price p USING(id_article) ';
            qry += 'SET ';
            qry += '  b.price = p.price,  ';
            qry += '  b.modified = NOW(),  ';
            qry += '  b.id_user_modified = ? ';
            qry += 'WHERE ';
            qry += '  b.id_basket_order = ?; ';
            parametros.push(id_user);
            parametros.push(id_basket_order);

            //Se actualizan los precios de los articulos COMPLEJOS tomando el precio más recientes
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

            qry += 'UPDATE ';
            qry += '  basket b  ';
            qry += '  JOIN tmp_price_complex p USING(id_complex_article) ';
            qry += 'SET ';
            qry += '  b.price = p.price,  ';
            qry += '  b.modified = NOW(),  ';
            qry += '  b.id_user_modified = ? ';
            qry += 'WHERE ';
            qry += '  b.id_basket_order = ?; ';
            parametros.push(id_user);
            parametros.push(id_basket_order);

            //Se cargan en la cabecera de la canasta los datos de dirección del cliente, fechas de envío y cierro la canasta cambiando su estado (status)
            qry += 'SET @numberOE = (SELECT MAX(number) + 1 FROM basket_order WHERE id_zone = ?);';
            parametros.push(id_zone);

            qry += 'UPDATE basket_order bo ';
            qry += 'SET bo.number = @numberOE, bo.id_zone = ?, bo.user_address = ?, bo.observation = ?, ';
            qry += 'bo.date_basket = ?, bo.hour = ?, bo.id_status = ?, bo.modified = NOW(), bo.id_user_modified = ? ';
            qry += 'WHERE bo.id_basket_order = ? AND id_user = ?;';

            parametros.push(id_zone);
            parametros.push(user_address);
            parametros.push(observation);
            parametros.push(date_basket);
            parametros.push(id_hour);
            parametros.push(globals.CANASTA_CERRADA);
            parametros.push(id_user);
            parametros.push(id_basket_order);
            parametros.push(id_user);
  
          console.log(parametros);

            qry_callback = connection.query(qry, parametros, function(err, basket){   

                connection.commit(function(err) {
             
                  if (err) {
                    msg = 'Error al cerrar la canasta.';
                    error = true;
                    return connection.rollback(function() {
                      res.jsonp([{ error: error, msg: msg }]);
                      return;
                    });
                  }
                  console.log('------------------Cierro la canasta (datos de entrega, precios, etc) (close_basket)--------------------');
                  console.log(qry_callback.sql);
                  console.log('------------------Cierro la canasta (datos de entrega, precios, etc) (close_basket)--------------------');

                  req.session.id_basket_order = null;

                  res.jsonp([basket]);
                }); //connection.commit

            }); //query
          } //id_basket_order !== undefined || id_basket_order !== null
        }); //connection.beginTransaction(function(err)
      }); //req.getConnection(function(err, connection)

    } else {
      error = true;
      msg = 'Sucedió un error al recibir los parámetros.';
      console.log (msg);
      res.jsonp([{ error: error, msg: msg }]);
    }
  } else {
    error = true;
    msg = 'El usuario no está logueado o bien sucedió un error al recibir los parámetros.';
    console.log (msg);
    res.jsonp([{ error: error, msg: msg }]);
  }
};