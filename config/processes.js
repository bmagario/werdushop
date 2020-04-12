'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  async = require('async'),
  globals = require(path.resolve('.','./config/globals')),
  config = require(path.resolve('./config/config')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash'),
  Excel = require('exceljs'),
  shared = require(path.resolve('.','./config/shared')),
  mysql = require('mysql');

/**
 * Generacion diaria de la orden de compra para la zona especificada.
 * @param  {[type]}   id_location   [description]
 * @param  {[type]}   location_desc [description]
 * @param  {[type]}   id_zone       [description]
 * @param  {[type]}   zone_desc     [description]
 * @param  {Function} callback      [description]
 * @return {[type]}                 [description]
 */
module.exports.generatePurchaseOrder = function generatePurchaseOrder(id_location, location_desc, id_zone, zone_desc, callback) {
  var connection = mysql.createConnection(config.mydb);
  var id_purchase_order;
  var qry = '';
  var qry_callback;
  var to = 'brian.magario@gmail.com';
  var subject = '';
  var html = '';
  console.log('###################### Orden Compra LOCALIDAD: ' + location_desc + ' - ZONA: ' + zone_desc + ' #########################');
  connection.beginTransaction(function(err) {
    if (err) {
      console.log('ERROR generatePurchaseOrder (beginTransaction): ' + err);
      html += '</br><p style="color:#ff0000;">ERROR generatePurchaseOrder (beginTransaction): ' + err + '</p>';
      subject = 'Orden Compra (ERROR): ' + zone_desc;
      shared.send_email(html, subject, to, null);
      callback(err);
      return;
    }

    var parametros = [];

    //Create temporary table of basket.
    qry = 'DROP TEMPORARY TABLE IF EXISTS tmp_articles_baskets;';
    qry += 'CREATE TEMPORARY TABLE tmp_articles_baskets (id_article INT, amount DECIMAL(10,3), PRIMARY KEY(id_article)) ';
    qry += 'SELECT ';
    qry += '  b.id_article, ';
    qry += '  SUM(b.amount * a.equivalence) amount ';
    qry += 'FROM ';
    qry += '  basket_order bo ';
    qry += '  JOIN basket b USING(id_basket_order) ';
    qry += '  JOIN article a USING(id_article) ';
    qry += 'WHERE ';
    qry += '  bo.id_location = ? ';
    qry += '  AND bo.id_zone = ? ';
    qry += '  AND bo.id_status = ? ';
    qry += '  AND b.id_article IS NOT NULL ';
    qry += 'GROUP BY b.id_article ';
    qry += '  HAVING SUM(b.amount) > 0 ';
    qry += ';';
    parametros.push(id_location);
    parametros.push(id_zone);
    parametros.push(globals.CANASTA_CERRADA);

    //Se agregan las compras de los articulos complejos.
    qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_articles_baskets_complex;';
    qry += 'CREATE TEMPORARY TABLE tmp_articles_baskets_complex (id_article INT, amount DECIMAL(10,3), INDEX(id_article)) ';
    qry += 'SELECT ';
    qry += '  cad.id_article, ';
    qry += '  SUM(b.amount * cad.equivalence_complex) amount ';
    qry += 'FROM ';
    qry += '  basket_order bo ';
    qry += '  JOIN basket b USING(id_basket_order) ';
    qry += '  JOIN complex_article_detail cad USING(id_complex_article) ';
    qry += 'WHERE ';
    qry += '  bo.id_location = ? ';
    qry += '  AND bo.id_zone = ? ';
    qry += '  AND bo.id_status = ? ';
    qry += '  AND b.id_complex_article IS NOT NULL ';
    qry += 'GROUP BY cad.id_article ';
    qry += '  HAVING SUM(b.amount) > 0 ';
    qry += ';';
    parametros.push(id_location);
    parametros.push(id_zone);
    parametros.push(globals.CANASTA_CERRADA);

    qry += 'INSERT INTO tmp_articles_baskets (id_article, amount) ';
    qry += 'SELECT id_article, amount FROM tmp_articles_baskets_complex tabc ';
    qry += 'ON DUPLICATE KEY UPDATE ';
    qry += '  tmp_articles_baskets.amount = tmp_articles_baskets.amount + tabc.amount ';
    qry += ';';

    //Stock Actual.
    qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_stock_date; ';
    qry += 'CREATE TEMPORARY TABLE tmp_stock_date ';
    qry += 'SELECT ';
    qry += '  st.id_article, ';
    qry += '  MAX(st.stock_date) stock_date ';
    qry += 'FROM ';
    qry += '  zone z ';
    qry += '  JOIN stock st USING(id_zone) ';
    qry += 'WHERE ';
    qry += '  z.id_zone = ? ';
    qry += 'GROUP BY st.id_article;';
    parametros.push(id_zone);

    qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_stock; ';
    qry += 'CREATE TEMPORARY TABLE tmp_stock (id_article INT, amount DECIMAL(10,3), INDEX(id_article)) ';
    qry += 'SELECT ';
    qry += '  st.id_article, ';
    qry += '  st.total amount ';
    qry += 'FROM ';
    qry += '  zone z ';
    qry += '  JOIN stock st USING(id_zone) ';
    qry += '  JOIN tmp_stock_date tstd ON(tstd.id_article = st.id_article AND tstd.stock_date = st.stock_date) ';
    qry += 'WHERE ';
    qry += '  z.id_zone = ? ';
    qry += '  AND st.total > 0;';
    parametros.push(id_zone);

    //Actualizamos las cantidades, quitandole lo que tenemos en stock.
    qry += 'UPDATE ';
    qry += '  tmp_articles_baskets tab ';
    qry += '  JOIN tmp_stock st USING(id_article) ';
    qry += 'SET ';
    qry += '  tab.amount = tab.amount - st.amount ';
    qry += '; ';
    qry_callback = connection.query(qry, parametros, function(err, result) {
      console.log(qry_callback.sql);
      if (err) {
        return connection.rollback(function() {
          console.log('ERROR generatePurchaseOrder (Create temporary table tmp_articles_baskets): ' + err);
          html += '</br><p style="color:#ff0000;">ERROR generatePurchaseOrder (Create temporary table tmp_articles_baskets): ' + err + '</p>';
          subject = 'Orden Compra (ERROR): ' + zone_desc;
          shared.send_email(html, subject, to, null);
          callback(err);
        });
      }

      //Selecciono las canastas sumarizadas por articulo.
      qry = 'SELECT * FROM tmp_articles_baskets;';
      qry_callback = connection.query(qry, [], function(err, articles) {
        console.log(qry_callback.sql);
        if (err) {
          return connection.rollback(function() {
            console.log('ERROR generatePurchaseOrder (select articles): ' + err);
            html += '</br><p style="color:#ff0000;">ERROR generatePurchaseOrder (select articles): ' + err + '</p>';
            subject = 'Orden Compra (ERROR): ' + zone_desc;
            shared.send_email(html, subject, to, null);
            callback(err);
          });
        }

        //Si no hay canastas con cantidades, envio un warning indicando esta situacion.
        if(!articles.length){
          return connection.rollback(function() {
            console.log('WARNING generatePurchaseOrder: Sin artículos a comprar');
            html += '</br><p style="color:#ff4400;">WARNING generatePurchaseOrder: Sin artículos a comprar </p>';
            subject = 'Orden Compra (WARNING): ' + zone_desc;
            shared.send_email(html, subject, to, null);
            callback(err);
          });
        }

        //Find max number purchase_order.
        qry = 'SELECT MAX(number) number FROM purchase_order WHERE id_zone = ? ';
        qry_callback = connection.query(qry, [id_zone], function(err, purchase_order) {
          console.log(qry_callback.sql);
          if (err) {
            return connection.rollback(function() {
              console.log('ERROR generatePurchaseOrder (Find max number purchase_order): ' + err);
              html += '</br><p style="color:#ff0000;">ERROR generatePurchaseOrder (Find max number purchase_order): ' + err + '</p>';
              subject = 'Orden Compra (ERROR): ' + zone_desc;
              shared.send_email(html, subject, to, null);
              callback(err);
            });
          }

          //Insert the new purchase_order.
          var number = 1;
          if(purchase_order.length && purchase_order[0].number !== null){
            number = parseInt(purchase_order[0].number) + 1;
          }
          qry = 'INSERT INTO purchase_order SET ? ';
          qry_callback = connection.query(qry, { id_zone: id_zone, number: number }, function(err, result) {
            console.log(qry_callback.sql);
            if (err) {
              return connection.rollback(function() {
                console.log('ERROR generatePurchaseOrder (Insert the new purchase_order): ' + err);
                html += '</br><p style="color:#ff0000;">ERROR generatePurchaseOrder (Insert the new purchase_order): ' + err + '</p>';
                subject = 'Orden Compra (ERROR): ' + zone_desc;
                shared.send_email(html, subject, to, null);
                callback(err);
              });
            }
            id_purchase_order = result.insertId;

            //Insertar los articulos en los detalles de la oc.
            qry = 'INSERT INTO purchase (id_purchase_order, id_article, amount) ';
            qry += 'SELECT ';
            qry += '  ?, ';
            qry += '  tab.id_article, ';
            qry += '  tab.amount ';
            qry += 'FROM ';
            qry += '  tmp_articles_baskets tab ';
            qry += 'WHERE ';
            qry += '  tab.amount > 0;';

            //Y se actualizan las canastas.
            qry += 'UPDATE basket_order SET id_status = ? WHERE id_location = ? AND id_zone = ? AND id_status = ?;';
            qry_callback = connection.query(qry, [id_purchase_order, globals.CANASTA_PENDIENTE_ENTREGA, id_location, id_zone, globals.CANASTA_CERRADA], function(err, result) {
              console.log(qry_callback.sql);
              if (err) {
                return connection.rollback(function() {
                  console.log('ERROR generatePurchaseOrder (Insert the new purchase_order): ' + err);
                  html += '</br><p style="color:#ff0000;">ERROR generatePurchaseOrder (Insert the new purchase_order): ' + err + '</p>';
                  subject = 'Orden Compra (ERROR): ' + zone_desc;
                  shared.send_email(html, subject, to, null);
                  callback(err);
                });
              }

              //Finalizando la transaccion.
              connection.commit(function(err) {
                if (err) {
                  return connection.rollback(function() {
                    console.log('ERROR generatePurchaseOrder (commit): ' + err);
                    html += '</br><p style="color:red;">ERROR generatePurchaseOrder (commit): ' + err + '</p>';
                    subject = 'Orden Compra (ERROR): ' + zone_desc;
                    shared.send_email(html, subject, to, null);
                    callback(err);
                    return;
                  });
                }

                //Se obtienen los articulos de la oc para generar el excel.
                qry = getQryPurchase(connection.escape(id_purchase_order));
                qry_callback = connection.query(qry, [], function(err, articles_purchase_order) {
                  console.log(qry_callback.sql);
                  if (err) {
                    console.log('WARNING generatePurchaseOrder (No se pudieron obtener los articulos de la oc): ' + err);
                    html += '</br><p style="color:#ff0000;">ERROR generatePurchaseOrder (No se pudieron obtener los articulos de la oc): ' + err + '</p>';
                    subject = 'Orden Compra (ERROR): ' + zone_desc;
                    shared.send_email(html, subject, to, null);
                    callback(err);
                    return;
                  }
                  //Finalizo la conexion.
                  connection.end();

                  //Envio el email con los datos de la nueva orden de compra.
                  console.log('OK generatePurchaseOrder');
                  html += '</br><p style="color:green;">OK generatePurchaseOrder </p>';
                  subject = 'Orden Compra (OK): ' + zone_desc;
                  var filename = 'OrdenCompra-'+zone_desc;
                  //shared.write_xlsx(path, filename, header, articles_purchase_order);
                  //var attachments = [{
                  //  filename: filename +'.xlsx',
                  //  path: filename +'.xlsx',
                  //  contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                  //}];
                  var attachments = [];
                  shared.send_email(html, subject, to, null, attachments);
                  callback();
                });
              });
            });
          });
        });
      });
    });
  });
};

module.exports.generateSurveyOrder = function generateSurveyOrder(id_location, location_desc, callback) {
  var connection = mysql.createConnection(config.mydb);
  var id_survey_order;
  var qry = '';
  var qry_callback;
  var to = 'brian.magario@gmail.com';
  var subject = '';
  var html = '';
  console.log('###################### Orden Relevamiento LOCALIDAD: ' + location_desc + ' #########################');
  connection.beginTransaction(function(err) {
    if (err) {
      console.log('ERROR generateSurveyOrder (beginTransaction): ' + err);
      html += '</br><p style="color:#ff0000;">ERROR generateSurveyOrder (beginTransaction): ' + err + '</p>';
      subject = 'Orden Relevamiento (ERROR): ' + location_desc;
      shared.send_email(html, subject, to, null);
      callback(err);
      return;
    }

    qry = 'DROP TEMPORARY TABLE IF EXISTS tmp_purchases_week;';
    qry += 'CREATE TEMPORARY TABLE tmp_purchases_week ';
    qry += 'SELECT ';
    qry += '  DISTINCT p.id_article ';
    qry += 'FROM ';
    qry += '  purchase_order po ';
    qry += '  JOIN zone z USING(id_zone) ';
    qry += '  JOIN purchase p USING(id_purchase_order) ';
    qry += 'WHERE ';
    qry += '  z.id_location = ? ';
    qry += '  AND po.id_status = ? ';
    qry += '  AND p.created >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) ';
    qry += '  AND p.total_clean > 0 ';
    qry += ';';

    qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_survey_week;';
    qry += 'CREATE TEMPORARY TABLE tmp_survey_week ';
    qry += 'SELECT ';
    qry += '  a.id_article ';
    qry += 'FROM ';
    qry += '  article a ';
    qry += '  JOIN article_location al USING(id_article) ';
    qry += '  LEFT JOIN tmp_purchases_week tpw USING(id_article) ';
    qry += 'WHERE ';
    qry += '  al.id_location = ? ';
    qry += '  AND tpw.id_article IS NULL ';
    qry += ';';
    qry_callback = connection.query(qry, [id_location, globals.OC_FINALIZADA, id_location], function(err, result) {
      console.log(qry_callback.sql);
      if (err) {
        return connection.rollback(function() {
          console.log('ERROR generateSurveyOrder (Create temporary table tmp_survey_week): ' + err);
          html += '</br><p style="color:#ff0000;">ERROR generateSurveyOrder (Create temporary table tmp_survey_week): ' + err + '</p>';
          subject = 'Orden Relevamiento (ERROR): ' + location_desc;
          shared.send_email(html, subject, to, null);
          callback(err);
        });
      }

      //Selecciono los articulos que se ingresaran a la orden de relevamiento semanal.
      qry = 'SELECT * FROM tmp_survey_week;';
      qry_callback = connection.query(qry, [], function(err, articles) {
        console.log(qry_callback.sql);
        if (err) {
          return connection.rollback(function() {
            console.log('ERROR generateSurveyOrder (select tmp_survey_week): ' + err);
            html += '</br><p style="color:#ff0000;">ERROR generateSurveyOrder (select tmp_survey_week): ' + err + '</p>';
            subject = 'Orden Relevamiento (ERROR): ' + location_desc;
            shared.send_email(html, subject, to, null);
            callback(err);
          });
        }

        //Si no hay canastas con cantidades, envio un warning indicando esta situacion.
        if(!articles.length){
          return connection.rollback(function() {
            console.log('WARNING generateSurveyOrder: Sin articulos a relevar');
            html += '</br><p style="color:#ff4400;">WARNING generateSurveyOrder: Sin articulos a relevar </p>';
            subject = 'Orden Relevamiento (WARNING): ' + location_desc;
            shared.send_email(html, subject, to, null);
            callback(err);
          });
        }

        //Find max number purchase_order.
        qry = 'SELECT MAX(number) number FROM survey_order WHERE id_location = ? ';
        qry_callback = connection.query(qry, [id_location], function(err, survey_order) {
          console.log(qry_callback.sql);
          if (err) {
            return connection.rollback(function() {
              console.log('ERROR generateSurveyOrder (Find max number purchase_order): ' + err);
              html += '</br><p style="color:#ff0000;">ERROR generateSurveyOrder (Find max number purchase_order): ' + err + '</p>';
              subject = 'Orden Relevamiento (ERROR): ' + location_desc;
              shared.send_email(html, subject, to, null);
              callback(err);
            });
          }

          //Insert the new purchase_order.
          var number = 1;
          if(survey_order.length && survey_order[0].number !== null){
            number = parseInt(survey_order[0].number) + 1;
          }
          qry = 'INSERT INTO survey_order SET ? ';
          qry_callback = connection.query(qry, { id_location: id_location, number: number }, function(err, result) {
            console.log(qry_callback.sql);
            if (err) {
              return connection.rollback(function() {
                console.log('ERROR generateSurveyOrder (Insert the new survey_order): ' + err);
                html += '</br><p style="color:#ff0000;">ERROR generateSurveyOrder (Insert the new survey_order): ' + err + '</p>';
                subject = 'Orden Relevamiento (ERROR): ' + location_desc;
                shared.send_email(html, subject, to, null);
                callback(err);
              });
            }
            id_survey_order = result.insertId;

            //Insertar los articulos en los detalles de la oc.
            qry = 'INSERT INTO survey (id_survey_order, id_article) ';
            qry += 'SELECT ';
            qry += '  ?, ';
            qry += '  tsw.id_article ';
            qry += 'FROM ';
            qry += '  tmp_survey_week tsw;';
            qry_callback = connection.query(qry, [id_survey_order], function(err, result) {
              console.log(qry_callback.sql);
              if (err) {
                return connection.rollback(function() {
                  console.log('ERROR generateSurveyOrder (Insert the new survey): ' + err);
                  html += '</br><p style="color:#ff0000;">ERROR generateSurveyOrder (Insert the new survey): ' + err + '</p>';
                  subject = 'Orden Relevamiento (ERROR): ' + location_desc;
                  shared.send_email(html, subject, to, null);
                  callback(err);
                });
              }

              //Finalizando la transaccion.
              connection.commit(function(err) {
                if (err) {
                  return connection.rollback(function() {
                    console.log('ERROR generateSurveyOrder (commit): ' + err);
                    html += '</br><p style="color:red;">ERROR generateSurveyOrder (commit): ' + err + '</p>';
                    subject = 'Orden Relevamiento (ERROR): ' + location_desc;
                    shared.send_email(html, subject, to, null);
                    callback(err);
                    return;
                  });
                }

                //Se obtienen los articulos de la orden de relevamiento para generar el excel.
                qry = getQrySurvey(connection.escape(id_survey_order));
                qry_callback = connection.query(qry, [], function(err, articles_survey_order) {
                  console.log(qry_callback.sql);
                  if (err) {
                    console.log('WARNING generateSurveyOrder (No se pudieron obtener los articulos de la oc): ' + err);
                    html += '</br><p style="color:#ff0000;">ERROR generateSurveyOrder (No se pudieron obtener los articulos de la oc): ' + err + '</p>';
                    subject = 'Orden Relevamiento (ERROR): ' + location_desc;
                    shared.send_email(html, subject, to, null);
                    callback(err);
                    return;
                  }
                  //Finalizo la conexion.
                  connection.end();

                  //Envio el email con los datos de la nueva orden de compra.
                  console.log('OK generateSurveyOrder');
                  html += '</br><p style="color:green;">OK generateSurveyOrder </p>';
                  subject = 'Orden Relevamiento (OK): ' + location_desc;
                  var filename = 'OrdenCompra-'+location_desc;
                  /*shared.write_xlsx(path, filename, header, articles_survey_order);
                  var attachments = [{
                    filename: filename +'.xlsx',
                    path: filename +'.xlsx',
                    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                  }];*/
                  var attachments = [];
                  shared.send_email(html, subject, to, null, attachments);
                  callback();
                });
              });
            });
          });
        });
      });
    });
  });
};


/**
 * Generacion diaria de la caja diaria. Se debe tener en cuenta la ultima caja
 * creda para obtener el monto inicial del dia.
 * @param  {[type]}   id_location   [description]
 * @param  {[type]}   location_desc [description]
 * @param  {[type]}   id_zone       [description]
 * @param  {[type]}   zone_desc     [description]
 * @param  {Function} callback      [description]
 * @return {[type]}                 [description]
 */
module.exports.generateDailyCash = function generateDailyCash(id_location, location_desc, id_zone, zone_desc, callback) {
  var connection = mysql.createConnection(config.mydb);
  var id_purchase_order;
  var qry = '';
  var qry_callback;
  var to = 'brian.magario@gmail.com';
  var subject = '';
  var html = '';
  console.log('###################### Caja Diaria LOCALIDAD: ' + location_desc + ' - ZONA: ' + zone_desc + ' #########################');
  connection.beginTransaction(function(err) {
    if (err) {
      console.log('ERROR generateDailyCash (beginTransaction): ' + err);
      html += '</br><p style="color:#ff0000;">ERROR generateDailyCash (beginTransaction): ' + err + '</p>';
      subject = 'Caja Diaria (ERROR): ' + zone_desc;
      shared.send_email(html, subject, to, null);
      callback(err);
      return;
    }

    var parametros = [];
    //Temporal para obtener la ultima caja creada.
    qry = 'DROP TEMPORARY TABLE IF EXISTS tmp_cash; ';
    qry += 'CREATE TEMPORARY TABLE tmp_cash ';
    qry += 'SELECT ';
    qry += '  cash.id_zone, ';
    qry += '  MAX(cash.cash_date) cash_date ';
    qry += 'FROM ';
    qry += '  cash ';
    qry += 'WHERE ';
    qry += '  cash.id_zone = ? ;';
    parametros.push(id_zone);

    //Se obtiene la ultima caja creada.
    qry += 'SELECT ';
    qry += '  cash.final_amount ';
    qry += 'FROM ';
    qry += '  cash ';
    qry += '  JOIN tmp_cash USING(id_zone, cash_date) ';
    qry += '; ';
    qry_callback = connection.query(qry, parametros, function(err, result) {
      console.log(qry_callback.sql);
      if (err) {
        return connection.rollback(function() {
          console.log('ERROR generateDailyCash (Getting last cash): ' + err);
          html += '</br><p style="color:#ff0000;">ERROR generateDailyCash (Getting last cash): ' + err + '</p>';
          subject = 'Caja Diaria (ERROR): ' + zone_desc;
          shared.send_email(html, subject, to, null);
          callback(err);
        });
      }

      //Se obtiene la query para insertar la nueva caja. Se envia el resultado del select de la ultima caja.
      qry = getQryNewCash(id_zone, result[2]);
      qry_callback = connection.query(qry, [], function(err, result) {
        console.log(qry_callback.sql);
        if (err) {
          return connection.rollback(function() {
            console.log('ERROR generateDailyCash (Getting last cash): ' + err);
            html += '</br><p style="color:#ff0000;">ERROR generateDailyCash (Getting last cash): ' + err + '</p>';
            subject = 'Caja Diaria (ERROR): ' + zone_desc;
            shared.send_email(html, subject, to, null);
            callback(err);
          });
        }

        //Finalizando la transaccion.
        connection.commit(function(err) {
          if (err) {
            return connection.rollback(function() {
              console.log('ERROR generateDailyCash (commit): ' + err);
              html += '</br><p style="color:red;">ERROR generateDailyCash (commit): ' + err + '</p>';
              subject = 'Caja Diaria (ERROR): ' + zone_desc;
              shared.send_email(html, subject, to, null);
              callback(err);
              return;
            });
          }
          //Finalizo la conexion.
          connection.end();

          //Envio el email de caja generada.
          console.log('OK generateDailyCash');
          html += '</br><p style="color:green;">OK generateDailyCash </p>';
          subject = 'Caja Diaria (OK): ' + zone_desc;
          var attachments = [];
          shared.send_email(html, subject, to, null, attachments);
          callback();
        });
      });
    });
  });
};

/**
 * Funcion para obtener la query de los articulos que estan en la orden de compra.
 * @param  {[type]} id_purchase_order [description]
 * @return {[type]}                   [description]
 */
function getQryPurchase(id_purchase_order){
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
  qry += '  b.name brand_name, ';
  qry += '  p.amount, ';
  qry += '  p.total_dirty, ';
  qry += '  p.total_waste, ';
  qry += '  p.total_clean, ';
  qry += '  p.total_price, ';
  qry += '  p.price ';
  qry += 'FROM ';
  qry += '  article a ';
  qry += '  JOIN measurement_unit mu USING(id_measurement_unit) ';
  qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
  qry += '  JOIN subgroup sg USING(id_subgroup) ';
  qry += '  JOIN grupo g USING(id_group) ';
  qry += '  JOIN purchase p USING(id_article) ';
  qry += '  LEFT JOIN brand b USING(id_brand) ';
  qry += 'WHERE ';
  qry += '  p.id_purchase_order = ' + id_purchase_order + ' ';
  qry += 'ORDER BY a.name;';
  return qry;
}

/**
 * Funcion para obtener la query de los articulos que estan en la orden de compra.
 * @param  {[type]} id_purchase_order [description]
 * @return {[type]}                   [description]
 */
function getQrySurvey(id_survey_order){
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
  qry += '  b.name brand_name, ';
  qry += '  s.total_surveyed, ';
  qry += '  s.total_price, ';
  qry += '  s.price ';
  qry += 'FROM ';
  qry += '  article a ';
  qry += '  JOIN measurement_unit mu USING(id_measurement_unit) ';
  qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
  qry += '  JOIN subgroup sg USING(id_subgroup) ';
  qry += '  JOIN grupo g USING(id_group) ';
  qry += '  JOIN survey s USING(id_article) ';
  qry += '  LEFT JOIN brand b USING(id_brand) ';
  qry += 'WHERE ';
  qry += '  s.id_survey_order = ' + id_survey_order + ' ';
  qry += 'ORDER BY a.name;';
  return qry;
}

function getQryNewCash(id_zone, result){
  var start_amount = 0;
  var qry = '';
  qry += 'INSERT INTO cash (id_zone, cash_date, start_amount) ';
  qry += 'SELECT ';
  qry += '  ' + id_zone + ', ';
  qry += '  CURDATE(), ';
  if(result.length){
    start_amount = result[0].final_amount;
  }
  qry += '  ' + start_amount + ' ';
  qry += ';';

  return qry;
}
