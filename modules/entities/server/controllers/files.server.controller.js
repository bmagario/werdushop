'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  async = require('async'),
  moment = require('moment'),
  globals = require(path.resolve('.','./config/globals')),
  mysql_helper = require(path.resolve('.','./config/mysql_helper')),
  excel_properties = require(path.resolve('.','./config/excel_properties')),
  pdf_properties = require(path.resolve('.','./config/pdf_properties')),
  multer = require('multer'),
  config = require(path.resolve('./config/config')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  _ = require('lodash');
var Excel = require('exceljs');
var PDFDocument = require('pdfkit');
var blobStream = require('blob-stream');

exports.download_deliveries_panel = function(req, res) {
  //Si se envio filtro por subgrupo.
  if(req.body.id_zone === undefined || req.body.id_zone === null ||
    req.body.date_basket === undefined || req.body.date_basket === null ||
    req.body.delivery_hour === undefined || req.body.delivery_hour === null){
    return res.status(400).send({
      message: 'Faltan parámetros.'
    });
  }
  var id_zone = req.body.id_zone;
  var date_basket = req.body.date_basket;
  var delivery_hour = req.body.delivery_hour;
  var qry = '';
  var qry_callback;
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    //WHERE.
    var where = '';
    where += 'WHERE ';
    where += '  bo.id_zone = ' + connection.escape(id_zone) + ' ';
    where += '  AND bo.date_basket = ' + connection.escape(moment(date_basket).format('YYYY-MM-DD')) + ' ';
    where += '  AND bo.hour = ' + connection.escape(delivery_hour) + ' ';
    where += '  AND bo.id_status = ' + connection.escape(globals.CANASTA_PENDIENTE_ENTREGA) + ' ';

    //ORDER BY.
    var order_by = 'ORDER BY fragility, name, id_basket_order ';

    //########################### ARTICULOS PEDIDOS ##########################

    //Se obtienen los articulos de las ordenes de entrega.
    qry = 'DROP TEMPORARY TABLE IF EXISTS tmp_article;';
    qry += 'CREATE TEMPORARY TABLE tmp_article ';
    qry += 'SELECT ';
    qry += '  DISTINCT ';
    qry += '  a.id_article, ';
    qry += '  NULL id_complex_article, ';
    qry += '  a.name, ';
    qry += '  a.scale, ';
    qry += '  a.equivalence, ';
    qry += '  a.fragility, ';
    qry += '  mu.abbreviation measurement_unit_abbreviation, ';
    qry += '  mu.abbreviation_plural measurement_unit_abbreviation_plural, ';
    qry += '  mue.abbreviation measurement_unit_equivalence_abbreviation, ';
    qry += '  mue.abbreviation_plural measurement_unit_equivalence_abbreviation_plural, ';
    qry += '  CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0), "", LPAD(a.code, 3, 0)) full_code ';
    qry += 'FROM ';
    qry += '  basket_order bo ';
    qry += '  JOIN status st USING(id_status) ';
    qry += '  JOIN basket b USING(id_basket_order) ';
    qry += '  JOIN article a USING(id_article) ';
    qry += '  JOIN measurement_unit mu ON(mu.id_measurement_unit = a.id_measurement_unit) ';
    qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
    qry += '  JOIN subgroup sg USING(id_subgroup) ';
    qry += '  JOIN grupo g USING(id_group) ';
    qry += where;
    qry += 'UNION ';
    qry += 'SELECT ';
    qry += '  DISTINCT ';
    qry += '  NULL id_article, ';
    qry += '  a.id_complex_article, ';
    qry += '  a.name, ';
    qry += '  "" scale, ';
    qry += '  "" equivalence, ';
    qry += '  100 fragility, ';
    qry += '  "" measurement_unit_abbreviation, ';
    qry += '  "" measurement_unit_abbreviation_plural, ';
    qry += '  "" measurement_unit_equivalence_abbreviation, ';
    qry += '  "" measurement_unit_equivalence_abbreviation_plural, ';
    qry += '  CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0), "", LPAD(a.code, 8, 0)) full_code ';
    qry += 'FROM ';
    qry += '  basket_order bo ';
    qry += '  JOIN status st USING(id_status) ';
    qry += '  JOIN user u USING(id_user) ';
    qry += '  JOIN basket b USING(id_basket_order) ';
    qry += '  JOIN complex_article a USING(id_complex_article) ';
    qry += '  JOIN subgroup sg USING(id_subgroup) ';
    qry += '  JOIN grupo g USING(id_group) ';
    qry += where;
    qry += ';';

    //Se crea la temporal auxiliar de articulos.
    qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_article_aux;';
    qry += 'CREATE TEMPORARY TABLE tmp_article_aux SELECT * FROM tmp_article;';

    //Se obtienen las ordenes de entrega.
    qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_delivery;';
    qry += 'CREATE TEMPORARY TABLE tmp_delivery ';
    qry += 'SELECT ';
    qry += '  DISTINCT bo.*, ';
    qry += '  st.name status_name, ';
    qry += '  u.display_name, ';
    qry += '  CONCAT(u.first_name, " ", u.last_name) user_name, ';
    qry += '  0 has_complex ';
    qry += 'FROM ';
    qry += '  basket_order bo ';
    qry += '  JOIN status st USING(id_status) ';
    qry += '  JOIN user u USING(id_user) ';
    qry += where;
    qry += ';';

    //Actualizo la temporal de deliveries para determinar si tiene articulo complejo.
    qry += 'UPDATE ';
    qry += '  tmp_delivery td ';
    qry += 'SET ';
    qry += ' td.has_complex = 1 ';
    qry += 'WHERE ';
    qry += '  td.id_basket_order IN( ';
    qry += '    SELECT  ';
    qry += '      b.id_basket_order  ';
    qry += '    FROM  ';
    qry += '      basket b ';
    qry += '    WHERE  ';
    qry += '      b.id_basket_order = td.id_basket_order  ';
    qry += '      AND b.id_complex_article IS NOT NULL ';
    qry += '    GROUP BY b.id_basket_order ';
    qry += '  ) ';
    qry += ';';

    //Se genera temporal auxiliar de deliveries.
    qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_delivery_aux;';
    qry += 'CREATE TEMPORARY TABLE tmp_delivery_aux SELECT * FROM tmp_delivery;';

    //Se seleccionan las ordenes de entrega.
    qry += 'SELECT * FROM tmp_delivery ORDER BY id_basket_order;';

    //Se obtiene la matriz para fabricar el panel de entrega.
    qry += 'SELECT ';
    qry += '  td.*, ';
    qry += '  a.*, ';
    qry += '  0 complex, ';
    qry += '  b.id_article, ';
    qry += '  NULL id_complex_article, ';
    qry += '  b.id_status status_basket, ';
    qry += '  b.id_basket, ';
    qry += '  b.gift, ';
    qry += '  b.amount, ';
    qry += '  b.price, ';
    qry += '  b.price * b.amount total, ';
    qry += '  b.amount * a.equivalence cantidad ';
    qry += 'FROM ';
    qry += '  tmp_delivery td ';
    qry += '  JOIN tmp_article a ';
    qry += '  LEFT JOIN basket b USING(id_basket_order, id_article) ';
    qry += 'WHERE ';
    qry += '  a.id_complex_article IS NULL ';
    qry += 'UNION ';
    qry += 'SELECT ';
    qry += '  td.*, ';
    qry += '  a.*, ';
    qry += '  1 complex, ';
    qry += '  NULL id_article, ';
    qry += '  b.id_complex_article, ';
    qry += '  b.id_status status_basket, ';
    qry += '  b.id_basket, ';
    qry += '  b.gift, ';
    qry += '  b.amount, ';
    qry += '  b.price, ';
    qry += '  b.price * b.amount total, ';
    qry += '  b.amount * a.equivalence cantidad ';
    qry += 'FROM ';
    qry += '  tmp_delivery_aux td ';
    qry += '  JOIN tmp_article_aux a ';
    qry += '  LEFT JOIN basket b USING(id_basket_order, id_complex_article) ';
    qry += 'WHERE ';
    qry += '  a.id_article IS NULL ';
    qry += order_by;
    qry += ';';

    //########################### ARTICULOS COMPLEJOS ##########################
    qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_article_complex;';
    qry += 'CREATE TEMPORARY TABLE tmp_article_complex ';
    qry += 'SELECT ';
    qry += '  a.*, ';
    qry += '  SUM(b.amount) amount ';
    qry += 'FROM ';
    qry += '  tmp_delivery_aux td ';
    qry += '  JOIN tmp_article_aux a ';
    qry += '  JOIN basket b USING(id_basket_order, id_complex_article) ';
    qry += 'WHERE ';
    qry += '  a.id_complex_article IS NOT NULL ';
    qry += 'GROUP BY a.id_complex_article ';
    qry += 'ORDER BY a.name ';
    qry += ';';

    //Se seleccionan los articulos complejos.
    qry += "SELECT * FROM tmp_article_complex;";

    //Se obtienen los articulos que forman parte de los articulos complejos.
    qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_article_complex_detail;';
    qry += 'CREATE TEMPORARY TABLE tmp_article_complex_detail ';
    qry += 'SELECT ';
    qry += '  DISTINCT ';
    qry += '  tac.id_complex_article, ';
    qry += '  a.id_article, ';
    qry += '  a.name, ';
    qry += '  a.scale, ';
    qry += '  a.fragility, ';
    qry += '  cad.scale_complex, ';
    qry += '  cad.equivalence_complex, ';
    qry += '  muc.abbreviation measurement_unit_abbreviation_complex, ';
    qry += '  muc.abbreviation_plural measurement_unit_abbreviation_plural_complex, ';
    qry += '  mu.abbreviation measurement_unit_abbreviation, ';
    qry += '  mu.abbreviation_plural measurement_unit_abbreviation_plural, ';
    qry += '  mue.abbreviation measurement_unit_equivalence_abbreviation, ';
    qry += '  mue.abbreviation_plural measurement_unit_equivalence_abbreviation_plural, ';
    qry += '  CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0), "", LPAD(a.code, 3, 0)) full_code ';
    qry += 'FROM ';
    qry += '  tmp_article_aux tac ';
    qry += '  JOIN complex_article_detail cad USING(id_complex_article) ';
    qry += '  JOIN article a ON(a.id_article = cad.id_article) ';
    qry += '  JOIN measurement_unit mu ON(mu.id_measurement_unit = a.id_measurement_unit) ';
    qry += '  JOIN measurement_unit muc ON(muc.id_measurement_unit = cad.id_measurement_unit) ';
    qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
    qry += '  JOIN subgroup sg USING(id_subgroup) ';
    qry += '  JOIN grupo g USING(id_group) ';
    qry += ';';

    //Datos de las compras de los articulos complejos.
    qry += 'SELECT ';
    qry += '  a.*, ';
    qry += '  tac.name name_complex, ';
    qry += '  tac.amount, ';
    qry += '  IF(tac.id_complex_article = a.id_complex_article, a.equivalence_complex, "") equivalence_complex_art, ';
    qry += '  IF(tac.id_complex_article = a.id_complex_article, tac.amount * a.equivalence_complex, NULL) cantidad ';
    qry += 'FROM ';
    qry += '  tmp_article_complex tac ';
    qry += '  JOIN tmp_article_complex_detail a ';
    qry += 'ORDER BY a.fragility, a.name, tac.name ';
    qry += ';';

    qry_callback = connection.query(qry, [], function(err, result) {
      console.log(qry_callback.sql);
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }

      var response = {
        deliveries: result[9],
        data: result[10],
        promociones: result[13],
        data_promociones: result[16]
      };
      write_xlsx(globals.PANEL_DELIVERIES, res, 'panel_entrega.xlsx', {}, response);
    });
  });
};

exports.download_deliveries = function(req, res) {
  //Si se envio filtro por subgrupo.
  if(req.body.id_zone === undefined || req.body.id_zone === null ||
    req.body.date_basket === undefined || req.body.date_basket === null ||
    req.body.delivery_hour === undefined || req.body.delivery_hour === null){
    return res.status(400).send({
      message: 'Faltan parámetros.'
    });
  }
  var id_zone = req.body.id_zone;
  var date_basket = req.body.date_basket;
  var delivery_hour = req.body.delivery_hour;
  var canastero = req.body.canastero;
  var qry = '';
  var qry_callback;
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    //WHERE.
    var where = '';
    where += 'WHERE ';
    where += '  bo.id_zone = ' + connection.escape(id_zone) + ' ';
    where += '  AND bo.date_basket = ' + connection.escape(moment(date_basket).format('YYYY-MM-DD')) + ' ';
    where += '  AND bo.hour = ' + connection.escape(delivery_hour) + ' ';
    where += '  AND bo.id_status = ' + connection.escape(globals.CANASTA_PENDIENTE_ENTREGA) + ' ';

    //ORDER BY.
    var order_by = 'ORDER BY id_basket_order, id_user, complex, full_code ';

    //Se obtienen los articulos de las ordenes de entrega.
    qry = 'DROP TEMPORARY TABLE IF EXISTS tmp_article;';
    qry += 'CREATE TEMPORARY TABLE tmp_article ';
    qry += 'SELECT ';
    qry += '  DISTINCT ';
    qry += '  a.id_article, ';
    qry += '  NULL id_complex_article, ';
    qry += '  a.name, ';
    qry += '  a.scale, ';
    qry += '  a.equivalence, ';
    qry += '  a.fragility, ';
    qry += '  mu.abbreviation measurement_unit_abbreviation, ';
    qry += '  mu.abbreviation_plural measurement_unit_abbreviation_plural, ';
    qry += '  mue.abbreviation measurement_unit_equivalence_abbreviation, ';
    qry += '  mue.abbreviation_plural measurement_unit_equivalence_abbreviation_plural, ';
    qry += '  CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0), "", LPAD(a.code, 3, 0)) full_code ';
    qry += 'FROM ';
    qry += '  basket_order bo ';
    qry += '  JOIN status st USING(id_status) ';
    qry += '  JOIN basket b USING(id_basket_order) ';
    qry += '  JOIN article a USING(id_article) ';
    qry += '  JOIN measurement_unit mu ON(mu.id_measurement_unit = a.id_measurement_unit) ';
    qry += '  JOIN measurement_unit mue ON(mue.id_measurement_unit = a.id_measurement_unit_equivalence) ';
    qry += '  JOIN subgroup sg USING(id_subgroup) ';
    qry += '  JOIN grupo g USING(id_group) ';
    qry += where;
    qry += 'UNION ';
    qry += 'SELECT ';
    qry += '  DISTINCT ';
    qry += '  NULL id_article, ';
    qry += '  a.id_complex_article, ';
    qry += '  a.name, ';
    qry += '  "" scale, ';
    qry += '  "" equivalence, ';
    qry += '  100 fragility, ';
    qry += '  "" measurement_unit_abbreviation, ';
    qry += '  "" measurement_unit_abbreviation_plural, ';
    qry += '  "" measurement_unit_equivalence_abbreviation, ';
    qry += '  "" measurement_unit_equivalence_abbreviation_plural, ';
    qry += '  CONCAT(LPAD(g.code, 2, 0), "", LPAD(sg.code, 3, 0), "", LPAD(a.code, 8, 0)) full_code ';
    qry += 'FROM ';
    qry += '  basket_order bo ';
    qry += '  JOIN status st USING(id_status) ';
    qry += '  JOIN user u USING(id_user) ';
    qry += '  JOIN basket b USING(id_basket_order) ';
    qry += '  JOIN complex_article a USING(id_complex_article) ';
    qry += '  JOIN subgroup sg USING(id_subgroup) ';
    qry += '  JOIN grupo g USING(id_group) ';
    qry += where;
    qry += ';';

    //Se crea la temporal auxiliar de articulos.
    qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_article_aux;';
    qry += 'CREATE TEMPORARY TABLE tmp_article_aux SELECT * FROM tmp_article;';

    //Se obtienen las ordenes de entrega.
    qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_delivery;';
    qry += 'CREATE TEMPORARY TABLE tmp_delivery ';
    qry += 'SELECT ';
    qry += '  DISTINCT bo.*, ';
    qry += '  st.name status_name, ';
    qry += '  u.email, ';
    qry += '  u.display_name, ';
    qry += '  u.first_name, ';
    qry += '  u.last_name, ';
    qry += '  CONCAT(u.first_name, " ", u.last_name) user_name, ';
    qry += '  IFNULL(u.phone, "--") phone, ';
    qry += '  IFNULL(u.cel_phone, "--") cel_phone, ';
    qry += '  u.gender ';
    // qry += '  ua.street, ';
    // qry += '  ua.number street_number, ';
    // qry += '  ua.floor, ';
    // qry += '  ua.apartment ';
    qry += 'FROM ';
    qry += '  basket_order bo ';
    qry += '  JOIN status st USING(id_status) ';
    qry += '  JOIN user u USING(id_user) ';
    // qry += '  JOIN user_address ua USING(id_user) ';
    qry += where;
    qry += ';';

    //Se genera temporal auxiliar de deliveries.
    qry += 'DROP TEMPORARY TABLE IF EXISTS tmp_delivery_aux;';
    qry += 'CREATE TEMPORARY TABLE tmp_delivery_aux SELECT * FROM tmp_delivery;';

    //Se seleccionan las cabeceras de las ordenes de entrega.
    qry += 'SELECT * FROM tmp_delivery ORDER BY id_basket_order, id_user;';

    //Se obtienen los datos de las ordenes de entrega.
    qry += 'SELECT ';
    qry += '  td.id_basket_order, ';
    qry += '  td.id_user, ';
    qry += '  td.number, ';
    qry += '  a.*, ';
    qry += '  0 complex, ';
    qry += '  b.id_article, ';
    qry += '  NULL id_complex_article, ';
    qry += '  b.id_status status_basket, ';
    qry += '  b.id_basket, ';
    qry += '  b.gift, ';
    qry += '  b.amount, ';
    qry += '  b.price, ';
    qry += '  b.price * b.amount total, ';
    qry += '  b.amount * a.scale cantidad_pedida, ';
    qry += '  b.amount * a.equivalence cantidad ';
    qry += 'FROM ';
    qry += '  tmp_delivery td ';
    qry += '  JOIN basket b USING(id_basket_order) ';
    qry += '  JOIN tmp_article a USING(id_article) ';
    qry += 'WHERE ';
    qry += '    a.id_article IS NOT NULL ';
    qry += 'UNION ';
    qry += 'SELECT ';
    qry += '  td.id_basket_order, ';
    qry += '  td.id_user, ';
    qry += '  td.number, ';
    qry += '  a.*, ';
    qry += '  1 complex, ';
    qry += '  NULL id_article, ';
    qry += '  b.id_complex_article, ';
    qry += '  b.id_status status_basket, ';
    qry += '  b.id_basket, ';
    qry += '  b.gift, ';
    qry += '  b.amount, ';
    qry += '  b.price, ';
    qry += '  b.price * b.amount total, ';
    qry += '  b.amount cantidad_pedida, ';
    qry += '  "" cantidad ';
    qry += 'FROM ';
    qry += '  tmp_delivery_aux td ';
    qry += '  JOIN basket b USING(id_basket_order) ';
    qry += '  JOIN tmp_article_aux a USING(id_complex_article) ';
    qry += 'WHERE ';
    qry += '    a.id_complex_article IS NOT NULL ';
    qry += order_by;
    qry += ';';

    qry_callback = connection.query(qry, [], function(err, result) {
      console.log(qry_callback.sql);
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      var response = {
        data_users: result[8],
        data_deliveries: result[9],
        canastero: canastero
      };
      write_pdf(globals.DELIVERIES, res, 'ordenes_entrega.pdf', {}, response);
    });
  });
};

//##################################### CALC ###################################
function write_xlsx(tipo, res, filename, header, response) {
  var result = {};
  if(tipo === globals.PANEL_DELIVERIES){
    result = createAndFillWorkbookDeliveriesPanel(filename, response);
  } else{
    result = { error: true, msg: 'ERROR GRAVE' };
  }

  if(result.error){
    res.jsonp([result]);
    return;
  } else{
    var workbook = result.workbook;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
    workbook.xlsx.write(res)
    .then(function() {
      res.end();
    });
  }
}

function createAndFillWorkbookDeliveriesPanel(filename, response){
  var error = false;

  var options = {
    filename: filename,
    useStyles: true,
    useSharedStrings: true
  };

  //Se crea el workbook.
  var workbook = new Excel.Workbook(options);
  workbook.creator = 'Werdulero';
  workbook.created = new Date();

  //Luego se agrega el worksheet con las propiedades requeridas.
  var worksheet = workbook.addWorksheet(filename, {
    pageSetup: { paperSize: 9, orientation: 'landscape' },
    properties: {
      showGridLines: true
    },
    views: [{
      x: 0, y: 0, width: 10000, height: 20000,
      firstSheet: 0, activeTab: 1, visibility: 'visible'
    }]
  });

  //############################################################################
  //                        ARMADO DE PEDIDOS
  //############################################################################
  var deliveries = response.deliveries;
  var data = response.data;
  var row_index = 1;
  row_index = seccionArmadoPedidos(worksheet, row_index, deliveries, data);

  //Agregar el salto de linea.
  worksheet = workbook.addWorksheet('promociones', {
    pageSetup: { paperSize: 9, orientation: 'landscape' },
    properties: {
      showGridLines: true
    },
    views: [{
      x: 0, y: 0, width: 10000, height: 20000,
      firstSheet: 0, activeTab: 1, visibility: 'visible'
    }]
  });

  //############################################################################
  //                        ARMADO DE PROMOCIONES
  //############################################################################
  var promociones = response.promociones;
  var data_promociones = response.data_promociones;
  row_index = 1;
  row_index = seccionArmadoPromociones(worksheet, row_index, promociones, data_promociones);

  return { error: error, workbook: workbook };
}

function seccionArmadoPedidos(worksheet, row_index, deliveries, data){
  var cant_first_col = 5;
  var current_row = null;
  var current_row_next = null;

  //Se pone el titulo.
  worksheet.addRow(["ARMADO DE PEDIDOS"]);
  worksheet.mergeCells('A'+row_index+':'+getNameFromNumber(deliveries.length + cant_first_col)+row_index);
  current_row = worksheet.getRow(row_index);
  current_row.height = 32;
  current_row.getCell(1).border = excel_properties.borderStyleAllMedium;
  current_row.getCell(1).alignment = excel_properties.alignmentCenter;
  current_row.getCell(1).font = excel_properties.fontTitle;

  //Se agrega el header.
  var header = ['ARTÍCULO', 'UNITARIO', '', 'TOTAL', ''];
  var header2 = ['', 'ESCALA', 'EQUIV', 'ESCALA', 'EQUIV'];
  for (let i = 0; i < deliveries.length; i++) {
    header.push(deliveries[i].number);
    header2.push('');
  }
  worksheet.addRow(header);
  worksheet.addRow(header2);
  row_index++;
  worksheet.mergeCells('B'+row_index+':C'+row_index);
  worksheet.mergeCells('D'+row_index+':E'+row_index);

  //Estilo del header.
  current_row = worksheet.getRow(row_index);
  current_row_next = worksheet.getRow(row_index+1);
  for (let i = 1; i <= deliveries.length + cant_first_col; i++) {
    if(i === 1){
      current_row.getCell(i).border = excel_properties.borderStyleLRMedium;
      current_row_next.getCell(i).border = excel_properties.borderStyleLRMedium;
    } else if(i === 3 || i === cant_first_col){
      current_row.getCell(i).border = excel_properties.borderStyleRMedium;
      current_row_next.getCell(i).border = excel_properties.borderStyleRMedium;
    } else if(i === deliveries.length + cant_first_col){
      current_row.getCell(i).border = excel_properties.borderStyleRMedium;
      current_row_next.getCell(i).border = excel_properties.borderStyleRMedium;
    }
    current_row.getCell(i).alignment = excel_properties.alignmentCenter;
    current_row_next.getCell(i).alignment = excel_properties.alignmentCenter;
  }
  row_index++;

  //Se recorren los datos.
  for (var d = 0; d < data.length;) {
    var name = data[d].name;
    var scale = data[d].scale;
    var equivalence = data[d].equivalence;
    var measurement_unit_abbreviation = data[d].measurement_unit_abbreviation;
    var measurement_unit_abbreviation_plural = data[d].measurement_unit_abbreviation_plural;
    var measurement_unit_equivalence_abbreviation = data[d].measurement_unit_equivalence_abbreviation;
    var measurement_unit_equivalence_abbreviation_plural = data[d].measurement_unit_equivalence_abbreviation_plural;
    var complex = data[d].complex;
    var row = [];
    var total = 0;
    var total2 = 0;

    row.push(name);
    row.push(scale + ' ' + measurement_unit_abbreviation);
    if(complex === 0){
      row.push(parseFloat(equivalence).toFixed(3) + ' ' + measurement_unit_equivalence_abbreviation);
    } else{
      row.push('');
    }
    row.push(0);
    row.push('');
    for (let j = 0; j < deliveries.length; j++) {
      var article = data[d];
      row.push(article.amount);
      total += article.amount;
      total2 += article.cantidad;
      d++;
    }
    row[3] = total + ' ' + measurement_unit_abbreviation_plural;

    //Si no es un articulo complejo, si agregar el total de equivalencia.
    if(complex === 0){
      row[4] = parseFloat(total2).toFixed(3) + ' ' + measurement_unit_equivalence_abbreviation_plural;
    }

    // Se agregan las rows al worksheet.
    worksheet.addRow(row);

    //Estilo de las celdas.
    current_row = worksheet.getRow(row_index+1);
    for (let i = 1; i <= deliveries.length + cant_first_col; i++) {
      if((row_index+1)%2 === 0){
        current_row.getCell(i).fill = excel_properties.fillLightBlue;
      }
      current_row.getCell(i).alignment = excel_properties.alignmentCenter;
      if(i === 1){
        current_row.getCell(i).border = excel_properties.borderStyleLRMedium;
        if(d === data.length){
          current_row.getCell(i).border = excel_properties.borderStyleBLRMedium;
        }
        current_row.getCell(i).alignment = excel_properties.alignmentLeft;
      } else if(i === 3){
        current_row.getCell(i).border = excel_properties.borderStyleRMedium;
        if(d === data.length){
          current_row.getCell(i).border = excel_properties.borderStyleBRMedium;
        }
      } else if(i === cant_first_col){
        current_row.getCell(i).border = excel_properties.borderStyleRMedium;
        if(d === data.length){
          current_row.getCell(i).border = excel_properties.borderStyleBRMedium;
        }
        if(complex === 1){
          current_row.getCell(i).font = excel_properties.fontSubTitleRed;
        }
      } else if(i === deliveries.length + cant_first_col){
        current_row.getCell(i).border = excel_properties.borderStyleRMedium;
        if(d === data.length){
          current_row.getCell(i).border = excel_properties.borderStyleBRMedium;
        }
      } else{
        if(d === data.length){
          current_row.getCell(i).border = excel_properties.borderStyleBMedium;
        }
      }
    }

    //Se aumenta la cantidad de rows del worksheet.
    row_index += 1;
  }
  return row_index;
}

function seccionArmadoPromociones(worksheet, row_index, promociones, data_promociones){
  var current_row = null;
  var current_row_next = null;
  var current_row_next_2 = null;
  var current_row_next_3 = null;
  var cant_first_col = 2;

  //Se pone el titulo.
  worksheet.addRow(["ARMADO DE PROMOCIONES"]);
  worksheet.mergeCells('A'+row_index+':'+getNameFromNumber(promociones.length*2 + cant_first_col)+row_index);
  current_row = worksheet.getRow(row_index);
  current_row.height = 32;
  current_row.getCell(1).border = excel_properties.borderStyleAllMedium;
  current_row.getCell(1).alignment = excel_properties.alignmentCenter;
  current_row.getCell(1).font = excel_properties.fontTitle;

  //Se agrega el header.
  var header = ['ARTÍCULO', 'TOTAL', 'RECETA'];
  var header2 = ['', ''];
  var header3 = ['CANTIDAD VENDIDA', ''];
  var header4 = ['', ''];
  for (let i = 0; i < promociones.length; i++) {
    header2.push(promociones[i].name);
    header2.push('');
    header3.push(promociones[i].amount);
    header3.push('');
    header4.push('ESCALA');
    header4.push('EQUIV');
  }
  worksheet.addRow(header);
  worksheet.addRow(header2);
  worksheet.addRow(header3);
  worksheet.addRow(header4);
  worksheet.mergeCells('A'+(row_index+1)+':A'+(row_index+2));
  worksheet.mergeCells('B'+(row_index+1)+':B'+(row_index+2));
  worksheet.mergeCells('C'+(row_index+1)+':'+getNameFromNumber(promociones.length*2 + cant_first_col)+(row_index+1));
  for (let i = cant_first_col+1; i <= promociones.length*2+1; i+=2) {
    worksheet.mergeCells(getNameFromNumber(i)+(row_index+2)+':'+getNameFromNumber(i+1)+(row_index+2));
    worksheet.mergeCells(getNameFromNumber(i)+(row_index+3)+':'+getNameFromNumber(i+1)+(row_index+3));
  }

  //Estilo del header.
  row_index += 1;
  current_row = worksheet.getRow(row_index);
  current_row_next = worksheet.getRow(row_index+1);
  current_row_next_2 = worksheet.getRow(row_index+2);
  current_row_next_3 = worksheet.getRow(row_index+3);
  for (let i = 1; i <= promociones.length*2 + cant_first_col; i++) {
    if(i === 1){
      current_row.getCell(i).border = excel_properties.borderStyleLMedium;
      current_row_next.getCell(i).border = excel_properties.borderStyleLMedium;
      current_row_next_2.getCell(i).border = excel_properties.borderStyleLMedium;
    } else if(i === promociones.length*2 + cant_first_col){
      current_row.getCell(i).border = excel_properties.borderStyleRMedium;
      current_row_next.getCell(i).border = excel_properties.borderStyleRMedium;
      current_row_next_2.getCell(i).border = excel_properties.borderStyleRMedium;
      current_row_next_3.getCell(i).border = excel_properties.borderStyleRMedium;
    }
    current_row.getCell(i).alignment = excel_properties.alignmentCenter;
    current_row_next.getCell(i).alignment = excel_properties.alignmentCenter;
    current_row_next_2.getCell(i).alignment = excel_properties.alignmentCenter;
    current_row.getCell(i).font = excel_properties.fontSubTitle;
    current_row_next.getCell(i).font = excel_properties.fontSubTitle;
    if(i > cant_first_col){
      current_row_next_2.getCell(i).font = excel_properties.fontSubTitleRed;
    } else{
      current_row_next_2.getCell(i).font = excel_properties.fontSubTitle;
    }
  }
  row_index += 3;

  //Se recorren los datos.
  for (var d = 0; d < data_promociones.length;) {
    var umed_scale_complex = data_promociones[d].measurement_unit_abbreviation_complex;
    var umed_equivalence_complex = data_promociones[d].measurement_unit_equivalence_abbreviation_plural;
    var row = [];
    var total = 0;

    row.push(data_promociones[d].name);
    row.push(0);
    for (let j = 0; j < promociones.length; j++) {
      var article = data_promociones[d];
      var scale_complex = article.scale_complex;
      var equivalence_complex = article.equivalence_complex_art;
      if(equivalence_complex === ''){
        row.push('');
        row.push('');
      } else{
        row.push(scale_complex + ' ' + umed_scale_complex);
        row.push(equivalence_complex + ' ' + umed_equivalence_complex);
      }
      total += article.cantidad;
      d++;
    }
    row[1] = parseFloat(total).toFixed(3) + ' ' + umed_equivalence_complex;

    // Se agregan las rows al worksheet.
    worksheet.addRow(row);

    //Estilo de las celdas.
    current_row = worksheet.getRow(row_index+1);
    for (let i = 1; i <= promociones.length*2 + cant_first_col; i++) {
      if((row_index+1)%2 === 0){
        current_row.getCell(i).fill = excel_properties.fillLightBlue;
      }
      if(i === 1){
        current_row.getCell(i).border = excel_properties.borderStyleLMedium;
        if(d === data_promociones.length){
          current_row.getCell(i).border = excel_properties.borderStyleBLMedium;
        }
      } else if(i === promociones.length*2 + cant_first_col){
        current_row.getCell(i).border = excel_properties.borderStyleRMedium;
        if(d === data_promociones.length){
          current_row.getCell(i).border = excel_properties.borderStyleBRMedium;
        }
      } else{
        if(d === data_promociones.length){
          current_row.getCell(i).border = excel_properties.borderStyleBMedium;
        }
      }
      current_row.getCell(i).alignment = excel_properties.alignmentCenter;
    }

    //Se aumenta la cantidad de rows del worksheet.
    row_index += 1;
  }
  return row_index;
}

function getNameFromNumber(num) {
    var numeric = (num - 1) % 26;
    var letter = chr(65 + numeric);
    var num2 = parseInt((num - 1) / 26);
    if (num2 > 0) {
        return getNameFromNumber(num2) + letter;
    } else {
        return letter;
    }
}

function chr(codePt) {
  //  discuss at: http://locutus.io/php/chr/
  // original by: Kevin van Zonneveld (http://kvz.io)
  // improved by: Brett Zamir (http://brett-zamir.me)
  //   example 1: chr(75) === 'K'
  //   example 1: chr(65536) === '\uD800\uDC00'
  //   returns 1: true
  //   returns 1: true
  if (codePt > 0xFFFF) { // Create a four-byte string (length 2) since this code point is high
    //   enough for the UTF-16 encoding (JavaScript internal use), to
    //   require representation with two surrogates (reserved non-characters
    //   used for building other characters; the first is "high" and the next "low")
    codePt -= 0x10000;
    return String.fromCharCode(0xD800 + (codePt >> 10), 0xDC00 + (codePt & 0x3FF));
  }
  return String.fromCharCode(codePt);
}

//##################################### PDF ####################################
function write_pdf(tipo, res, filename, header, response) {
  var result = {};
  if(tipo === globals.DELIVERIES){
    result = createAndFillPDFDeliveries(filename, response);
  } else{
    result = { error: true, msg: 'ERROR GRAVE' };
  }

  if(result.error){
    res.jsonp([result]);
    return;
  } else{
    var error = result.error;
    var doc = result.doc;
    if(!error){
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
      doc.pipe(res);
      doc.end();
    } else{
      result = { error: true, msg: 'ERROR GRAVE' };
      res.jsonp([result]);
      return;
    }
  }
}

function createAndFillPDFDeliveries(filename, response){
  // A5: [419.53, 595.28]
  var error = false;
  var doc = new PDFDocument({
    margins: {
      top: 10,
      bottom: 10,
      left: 15,
      right: 3
    },
    size: 'A5'
  });

  try{
      var data_users = response.data_users;
      var data_deliveries = response.data_deliveries;
      var index = 0;
      for (let i = 0; i < data_users.length; i++) {
        var doc_data = {
          canastero: response.canastero,
          margins: doc.page.margins,
          page_x: doc.page.margins.left,
          page_y: doc.page.margins.top,
          page_width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
          page_height: doc.page.height - doc.page.margins.top - doc.page.margins.bottom
        };

        if(i !== 0){
          doc.addPage();
        }
        crearHeaderPDF(doc, doc_data, data_users[i]);
        index = crearBodyPDF(doc, doc_data, data_users[i], data_deliveries, index);
        crearFooterPDF(doc, doc_data, data_users[i], i+1, index);
      }
  } catch(e){
    console.log(e);
    error = true;
    doc = null;
  }

  return { doc: doc, error: error };
}

function crearHeaderPDF(doc, doc_data, data_user){
  // Add an image, constrain it to a given size, and center it vertically and horizontally
  doc.image('modules/core/client/img/brand/logo.png', {
     fit: [50, 50],
     align: 'left',
     valign: 'center'
  });
  doc_data.page_x = pdf_properties.baseLeftMargin;
  doc_data.page_y = pdf_properties.baseTopMargin;

  //Titulo
  doc.fontSize(pdf_properties.fontTitle.size);
  doc_data.page_y = doc_data.page_y - pdf_properties.fontTitle.size;
  doc.text('ORDEN DE ENTREGA', 0, doc_data.page_y, {
     align: 'center',
  });
  doc_data.page_y = pdf_properties.baseTopMargin;
  doc_data.page_y += 5;

  crearDatosUsuarioPDF(doc, doc_data, data_user);
}

function crearDatosUsuarioPDF(doc, doc_data, data_user){
  //Datos del usuario.
  var params = {
    text: 'DATOS DEL CLIENTE',
    align: 'center',
    width: 380,
    height: 16,
    font_size: 10,
    fill: false,
    fill_color: 'white',
    font_color: 'black',
    bold: false,
    changeX: true,
    changeY: true
  };
  pdfCell(doc, doc_data, params);
  doc_data.page_x = pdf_properties.baseLeftMargin;
  var baseTopUserInfo = doc_data.page_y;

  //Username.
  params = {
    text: ' Cliente: ',
    align: 'left',
    width: 45,
    height: 11,
    font_size: 8,
    fill: false,
    font_color: 'black',
    bold: true,
    changeX: true,
    changeY: false
  };
  pdfText(doc, doc_data, params);
  params.text = data_user.user_name;
  params.bold = false;
  params.changeY = true;
  params.width = 235;
  pdfText(doc, doc_data, params);
  doc_data.page_x = pdf_properties.baseLeftMargin;

  //Address.
  params.text = ' Domicilio: ';
  params.bold = true;
  params.changeY = false;
  params.width = 45;
  pdfText(doc, doc_data, params);
  params.text = data_user.user_address;
  params.bold = false;
  params.changeY = true;
  params.width = 235;
  pdfText(doc, doc_data, params);
  doc_data.page_x = pdf_properties.baseLeftMargin;

  //Telefonos.
  params.text = ' Teléfonos: ';
  params.bold = true;
  params.changeY = false;
  params.width = 45;
  pdfText(doc, doc_data, params);
  params.text = data_user.cel_phone;
  params.bold = false;
  params.changeY = true;
  params.width = 235;
  pdfText(doc, doc_data, params);
  doc_data.page_x = pdf_properties.baseLeftMargin;

  //Email.
  params.text = ' Email: ';
  params.bold = true;
  params.changeY = false;
  params.width = 45;
  pdfText(doc, doc_data, params);
  params.text = data_user.email;
  params.bold = false;
  params.changeY = true;
  params.width = 235;
  pdfText(doc, doc_data, params);
  doc_data.page_x = pdf_properties.baseLeftMargin;
  doc_data.page_y = baseTopUserInfo;
  params.width = 280;
  params.height = 11*4;

  doc
  .rect(
    doc_data.page_x,
    doc_data.page_y,
    params.width,
    params.height
  );

  //Vuelvo al top de la info del usuario.
  params.height = 11;
  doc_data.page_x = pdf_properties.baseLeftMargin + 280;

  //N° Orden.
  params.text = ' N° Orden: ';
  params.bold = true;
  params.changeY = false;
  params.width = 45;
  pdfText(doc, doc_data, params);
  params.text = data_user.number;
  params.bold = false;
  params.changeY = true;
  params.width = 55;
  pdfText(doc, doc_data, params);
  doc_data.page_x = pdf_properties.baseLeftMargin + 280;

  //Email.
  params.text = ' Fecha: ';
  params.bold = true;
  params.changeY = false;
  params.width = 45;
  pdfText(doc, doc_data, params);
  params.text = moment(data_user.date_basket, 'YYYY-MM-DD').format('DD/MM/YYYY');
  params.bold = false;
  params.changeY = true;
  params.width = 55;
  pdfText(doc, doc_data, params);
  doc_data.page_x = pdf_properties.baseLeftMargin + 280;
  doc_data.page_y = baseTopUserInfo;
  params.width = 100;
  params.height = 11*4;

  doc
  .rect(
    doc_data.page_x,
    doc_data.page_y,
    params.width,
    params.height
  );
  doc_data.page_x = pdf_properties.baseLeftMargin;
  doc_data.page_y = baseTopUserInfo + params.height;

  var baseTopObservations = doc_data.page_y;
  if(doc_data.canastero){
    params = {
      text: ' Observaciones: ',
      align: 'left',
      width: 70,
      height: 11,
      font_size: 8,
      fill: false,
      fill_color: 'white',
      font_color: 'black',
      bold: true,
      changeX: true,
      changeY: false
    };
    pdfText(doc, doc_data, params);
    doc_data.page_x = pdf_properties.baseLeftMargin;
    doc_data.page_y = baseTopObservations;
    params.width = 380;
    params.height = 11*4;

    doc
    .rect(
      doc_data.page_x,
      doc_data.page_y,
      params.width,
      params.height
    ).stroke();
    doc_data.page_x = pdf_properties.baseLeftMargin;
    doc_data.page_y = baseTopObservations + params.height;
  }

  //Final space between user's info and articles's table.
  doc_data.page_y += 2;
}

function crearBodyPDF(doc, doc_data, data_users, data_deliveries, index){
  var cant_rows = data_deliveries.length;
  //Genera el header de la tabla.
  var params = {
    text: 'Código',
    align: 'center',
    width: 62,
    height: 10,
    font_size: 8,
    fill: false,
    font_color: 'black',
    bold: true,
    changeX: true,
    changeY: false
  };
  pdfCell(doc, doc_data, params);
  params.text = 'Descripción';
  params.width = 128;
  pdfCell(doc, doc_data, params);
  params.text = 'Cantidad';
  params.width = 40;
  pdfCell(doc, doc_data, params);
  params.text = 'Unidad';
  params.width = 50;
  pdfCell(doc, doc_data, params);
  params.text = 'Precio';
  pdfCell(doc, doc_data, params);
  params.text = 'Total';
  params.changeY = true;
  pdfCell(doc, doc_data, params);
  doc_data.page_x = pdf_properties.baseLeftMargin;

  //Genera el body de la tabla.
  var total = 0;
  var id_basket_order = data_deliveries[index].id_basket_order;
  params.bold = false;
  while(index < cant_rows && id_basket_order === data_deliveries[index].id_basket_order){
    var datos = data_deliveries[index];
    id_basket_order = datos.id_basket_order;

    //Codigo.
    params.text = datos.full_code;
    params.width = 62;
    params.align = 'center';
    params.changeY = false;
    pdfCell(doc, doc_data, params);

    //Descripcion.
    params.text = ' ' + datos.name;
    params.width = 128;
    params.align = 'left';
    pdfCell(doc, doc_data, params);

    //Cantidad.
    params.text = datos.complex === 0 ? parseFloat(datos.cantidad_pedida).toFixed(3) : datos.cantidad_pedida;
    params.width = 40;
    params.align = 'right';
    pdfCell(doc, doc_data, params);

    //Unidad.
    params.text = ' ' + datos.measurement_unit_abbreviation_plural;
    params.width = 50;
    params.align = 'left';
    pdfCell(doc, doc_data, params);

    //Precio.
    params.text = parseFloat(datos.price).toFixed(3) + ' $';
    params.align = 'right';
    pdfCell(doc, doc_data, params);

    //Total
    params.text = parseFloat(datos.total).toFixed(3) + ' $';
    params.changeY = true;
    pdfCell(doc, doc_data, params);
    doc_data.page_x = pdf_properties.baseLeftMargin;
    total += datos.total;
    index++;
  }

  params.text = 'TOTAL';
  params.width = 330;
  params.changeY = false;
  params.changeX = true;
  params.align = 'right';
  params.bold = true;
  pdfCell(doc, doc_data, params);
  params.changeY = true;
  params.width = 50;
  params.text = parseFloat(total).toFixed(3) + ' $ ';
  params.bold = false;
  pdfCell(doc, doc_data, params);

  //Final space between articles's table and comments's.
  doc_data.page_x = pdf_properties.baseLeftMargin;
  doc_data.page_y += 2;

  //Genera el footer de la tabla.
  return index;
}

function crearFooterPDF(doc, doc_data, data_users, page, index){
  doc_data.page_x = pdf_properties.baseLeftMargin;
  var baseTopComments = doc_data.page_y;
  if(!doc_data.canastero){
    var params = {
      text: ' Comentarios: ',
      align: 'left',
      width: 60,
      height: 11,
      font_size: 8,
      fill: false,
      fill_color: 'white',
      font_color: 'black',
      bold: true,
      changeX: true,
      changeY: false
    };
    pdfText(doc, doc_data, params);
    params.text = data_users.observation;
    params.bold = false;
    params.width = 320;
    params.is_comment = true;
    pdfText(doc, doc_data, params);
    doc_data.page_x = pdf_properties.baseLeftMargin;
    doc_data.page_y = baseTopComments;
    params.width = 380;
    params.height = 11*4;

    doc
    .rect(
      doc_data.page_x,
      doc_data.page_y,
      params.width,
      params.height
    ).stroke();
  }
}

function pdfCell(doc, doc_data, params){
  var verticalAlign = 0.25 * doc.heightOfString(params.text);

  doc
  .rect(
    doc_data.page_x,
    doc_data.page_y,
    params.width,
    params.height
  );
  if(params.fill){
    doc
    .fillColor(params.fill_color)
    .fill();
  }

  if(params.bold){
    doc.font('Helvetica-Bold');
  } else{
    doc.font('Helvetica');
  }

  doc
  .stroke()
  .fillColor(params.font_color)
  .fontSize(params.font_size)
  .text(
    params.text,
    doc_data.page_x,
    doc_data.page_y + verticalAlign, {
    width: params.align === 'right' ? params.width - 1 : params.width,
    align: params.align
  });

  if(params.changeX){
    doc_data.page_x += params.width;
  }
  if(params.changeY){
    doc_data.page_y += params.height;
  }
}

function pdfText(doc, doc_data, params){
  var verticalAlign = 0.25 * doc.heightOfString(params.text);
  if(params.hasOwnProperty('is_comment') && params.is_comment){
    verticalAlign = 0.25 * params.height;
  }

  if(params.bold){
    doc.font('Helvetica-Bold');
  } else{
    doc.font('Helvetica');
  }

  doc
  .stroke()
  .fillColor(params.font_color)
  .fontSize(params.font_size)
  .text(
    params.text,
    doc_data.page_x,
    doc_data.page_y + verticalAlign, {
    width: params.width,
    align: params.align
  });

  if(params.changeX){
    doc_data.page_x += params.width;
  }
  if(params.changeY){
    doc_data.page_y += params.height;
  }
}
