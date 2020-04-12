'use strict';

var _ = require('lodash'),
  config = require('../config'),
  chalk = require('chalk'),
  async = require('async'),
  globals = require('../globals'),
  mysql = require('mysql'),
  connection = mysql.createConnection(config.mydb);

module.exports.start = function start(options) {
  return new Promise(function (resolve, reject) {
    /*loadStatus(resolve, reject);*/
    /*loadRoles(resolve, reject);*/
    /*loadProvinces(resolve, reject);*/
    /*loadLocations(resolve, reject);*/
    /*loadZones(resolve, reject);*/
    /*loadMeasurementUnits(resolve, reject);*/
  });
};

/**
 * Carga inicial de los estados.
 * @param  {[type]} resolve [description]
 * @param  {[type]} reject  [description]
 * @return {[type]}         [description]
 */
function loadStatus(resolve, reject){
  var activo = [globals.ACTIVO, globals.ACTIVO, '"ACTIVO"', '"Estado Activo"' ];
  var no_activo = [globals.NO_ACTIVO, globals.ACTIVO, '"NO ACTIVO"', '"Estado No Activo"' ];
  var suspendido = [globals.SUSPENDIDO, globals.ACTIVO, '"SUSPENDIDO"', '"Estado Suspendido"' ];
  var suspendido_temporada = [globals.SUSPENDIDO_TEMPORADA, globals.ACTIVO, '"SUSPENDIDO_TEMPORADA"', '"Estado Suspendido Temporada"' ];
  var activa = [globals.ACTIVA, globals.ACTIVO, '"ACTIVA"', '"Estado Activa"' ];
  var cerrada = [globals.CERRADA, globals.ACTIVO, '"CERRADA"', '"Estado Cerrada"' ];
  var en_oc = [globals.EN_OC, globals.ACTIVO, '"EN OC"', '"Estado En Orden de Compra"' ];
  var entregada = [globals.ENTREGADA, globals.ACTIVO, '"ENTREGADA"', '"Estado Entregada"' ];
  var oc_activa = [globals.OC_ACTIVA, globals.ACTIVO, '"OC ACTIVA"', '"Estado OC Activa"' ];
  var oc_finalizada = [globals.OC_FINALIZADA, globals.ACTIVO, '"OC FINALIZADA"', '"Estado OC Finalizada"' ];
  var oe_activa = [globals.OE_ACTIVA, globals.ACTIVO, '"OE ACTIVA"', '"Estado OE Activa"' ];
  var oe_finalizada = [globals.OE_FINALIZADA, globals.ACTIVO, '"OE FINALIZADA"', '"Estado OE Finalizada"' ];
  var stock_activo = [globals.STOCK_ACTIVO, globals.ACTIVO, '"STOCK ACTIVO"', '"Estado Stock Activo"' ];
  var stock_cerrado = [globals.STOCK_CERRADO, globals.ACTIVO, '"STOCK CERRADO"', '"Estado Stock Cerrado"' ];
  var relevamiento_activo = [globals.RELEVAMIENTO_ACTIVO, globals.ACTIVO, '"RELEVAMIENTO ACTIVO"', '"Estado Relevamiento Activo"' ];
  var relevamiento_finalizado = [globals.RELEVAMIENTO_FINALIZADO, globals.ACTIVO, '"RELEVAMIENTO FINALIZADO"', '"Estado Relevamiento Finalizado"' ];
  var articulo_a_entregar = [globals.ARTICULO_A_ENTREGAR, globals.ACTIVO, '"ARTICULO A ENTREGAR"', '"Estado Artículo A Entregar"' ];
  var articulo_entregado = [globals.ARTICULO_ENTREGADO, globals.ACTIVO, '"ARTICULO ENTREGADO"', '"Estado Artículo Entregado"' ];
  var articulo_no_entregado = [globals.ARTICULO_NO_ENTREGADO, globals.ACTIVO, '"ARTICULO NO ENTREGADO"', '"Estado Artículo No Entregado"' ];
  var qry = '';
  qry += 'INSERT INTO status ';
  qry += ' (id_status, status, name, description) ';
  qry += 'VALUES ';
  qry += ' ( ' + activo.join(',') + ' ),';
  qry += ' ( ' + no_activo.join(',') + ' ),';
  qry += ' ( ' + suspendido.join(',') + ' ),';
  qry += ' ( ' + suspendido_temporada.join(',') + ' ),';
  qry += ' ( ' + activa.join(',') + ' ),';
  qry += ' ( ' + cerrada.join(',') + ' ),';
  qry += ' ( ' + en_oc.join(',') + ' ),';
  qry += ' ( ' + entregada.join(',') + ' ),';
  qry += ' ( ' + oc_activa.join(',') + ' ),';
  qry += ' ( ' + oc_finalizada.join(',') + ' ),';
  qry += ' ( ' + oe_activa.join(',') + ' ),';
  qry += ' ( ' + oe_finalizada.join(',') + ' ),';
  qry += ' ( ' + stock_activo.join(',') + ' ),';
  qry += ' ( ' + stock_cerrado.join(',') + ' ),';
  qry += ' ( ' + relevamiento_activo.join(',') + ' ),';
  qry += ' ( ' + relevamiento_finalizado.join(',') + ' ),';
  qry += ' ( ' + articulo_a_entregar.join(',') + ' ),';
  qry += ' ( ' + articulo_entregado.join(',') + ' ),';
  qry += ' ( ' + articulo_no_entregado.join(',') + ' )';
  insertItems(qry, resolve, reject, 'status');
}

/**
 * Agregar los roles de la aplicacion.
 * @param  {[type]} resolve [description]
 * @param  {[type]} reject  [description]
 * @return {[type]}         [description]
 */
function loadRoles(resolve, reject){
  var admin = [globals.ROL_ADMIN, '"admin"', '"Encargado de Administrar el sitio"' ];
  var user = [globals.ROL_USER, '"user"', '"Cliente del Sitio"' ];
  var qry = '';
  qry += 'INSERT INTO rol ';
  qry += ' (id_rol, name, description) ';
  qry += 'VALUES ';
  qry += ' ( ' + admin.join(',') + ' ),';
  qry += ' ( ' + user.join(',') + ' ) ';
  insertItems(qry, resolve, reject, 'rol');
}

/**
 * Carga inicial de las provincias.
 * @param  {[type]} resolve [description]
 * @param  {[type]} reject  [description]
 * @return {[type]}         [description]
 */
function loadProvinces(resolve, reject){
  var buenos_aires = [globals.PROVINCES.BUENOS_AIRES, '"Buenos Aires"', '"Provincia de Buenos Aires"' ];
  var caba = [globals.PROVINCES.CABA, '"CABA"', '"Ciudad Autónoma de Buenos Aires"' ];
  var qry = '';
  qry += 'INSERT INTO province ';
  qry += ' (id_province, name, description) ';
  qry += 'VALUES ';
  qry += ' ( ' + buenos_aires.join(',') + ' ), ';
  qry += ' ( ' + caba.join(',') + ' ) ';
  insertItems(qry, resolve, reject, 'province');
}

/**
 * Carga inicial de las localidades.
 * @param  {[type]} resolve [description]
 * @param  {[type]} reject  [description]
 * @return {[type]}         [description]
 */
function loadLocations(resolve, reject){
  var bahia_blanca = [globals.PROVINCES.BUENOS_AIRES, globals.LOCATIONS.BAHIA_BLANCA, '"Bahía Blanca"', '"Ciudad de Bahía Blanca"' ];
  var capital = [globals.PROVINCES.CABA, globals.LOCATIONS.CAPITAL_FEDERAL, '"Capital Federal"', '"Capital Federal"' ];
  var qry = '';
  qry += 'INSERT INTO location ';
  qry += ' (id_province, id_location, name, description) ';
  qry += 'VALUES ';
  qry += ' ( ' + bahia_blanca.join(',') + ' ), ';
  qry += ' ( ' + capital.join(',') + ' ) ';
  insertItems(qry, resolve, reject, 'location');
}

/**
 * Carga inicial de las unidades de medida.
 * @param  {[type]} resolve [description]
 * @param  {[type]} reject  [description]
 * @return {[type]}         [description]
 */
function loadZones(resolve, reject){
  var zona_bb_1 = [globals.LOCATIONS.BAHIA_BLANCA, globals.ZONES.BAHIA_BLANCA_1, '"Zona 1"', '"Zona 1 (Bahía Blanca)"' ];
  var zona_cf_1 = [globals.LOCATIONS.CAPITAL_FEDERAL, globals.ZONES.CAPITAL_FEDERAL_1, '"Zona 1"', '"Zona 1 (Capital Federal)"' ];
  var qry = '';
  qry += 'INSERT INTO zone ';
  qry += ' (id_location, id_zone, name, description) ';
  qry += 'VALUES ';
  qry += ' ( ' + zona_bb_1.join(',') + ' ), ';
  qry += ' ( ' + zona_cf_1.join(',') + ' ) ';
  insertItems(qry, resolve, reject, 'zone');
}

/**
 * Carga inicial de las unidades de medida.
 * @param  {[type]} resolve [description]
 * @param  {[type]} reject  [description]
 * @return {[type]}         [description]
 */
function loadMeasurementUnits(resolve, reject){
  var kg = ['"KiloGramos"', '"kg"', '"kg"' ];
  var g = ['"Gramos"', '"g"', '"g"' ];
  var porcion = ['"Porción"', '"porción"', '"porciones"' ];
  var atado = ['"Atado"', '"atado"', '"atados"' ];
  var bandeja = ['"Bandeja"', '"bandeja"', '"bandejas"' ];
  var unidad = ['"Unidad"', '"unidad"', '"unidad"' ];
  var cajon = ['"Cajón"', '"caj"', '"cajs"' ];
  var docena = ['"Docena"', '"doc"', '"docs"' ];
  var mapple = ['"Maple"', '"map"', '"maps"' ];
  var litros = ['"Litros"', '"l"', '"l"' ];
  var cm3 = ['"Centímetros Cúbicos"', '"cm3"', '"cm3"' ];
  var paquete = ['"Paquete"', '"paquete"', '"paquetes"' ];
  var bidon = ['"Bidón"', '"bidón"', '"bidones"' ];
  var botella = ['"Botella"', '"botella"', '"botellas"' ];
  var bolsas = ['"Bolsa"', '"bolsa"', '"bolsas"' ];
  var qry = '';
  qry += 'INSERT INTO measurement_unit ';
  qry += ' (name, abbreviation, abbreviation_plural) ';
  qry += 'VALUES ';
  qry += ' ( ' + kg.join(',') + ' ), ';
  qry += ' ( ' + g.join(',') + ' ), ';
  qry += ' ( ' + porcion.join(',') + ' ), ';
  qry += ' ( ' + atado.join(',') + ' ), ';
  qry += ' ( ' + porcion.join(',') + ' ), ';
  qry += ' ( ' + bandeja.join(',') + ' ), ';
  qry += ' ( ' + unidad.join(',') + ' ), ';
  qry += ' ( ' + cajon.join(',') + ' ), ';
  qry += ' ( ' + docena.join(',') + ' ), ';
  qry += ' ( ' + mapple.join(',') + ' ), ';
  qry += ' ( ' + litros.join(',') + ' ), ';
  qry += ' ( ' + cm3.join(',') + ' ), ';
  qry += ' ( ' + paquete.join(',') + ' ), ';
  qry += ' ( ' + bidon.join(',') + ' ), ';
  qry += ' ( ' + botella.join(',') + ' ), ';
  qry += ' ( ' + bolsas.join(',') + ' ) ';
  insertItems(qry, resolve, reject, 'measurement_unit');
}

/**
 * Insercion inicial en la bd.
 * @param {[type]} qry   [description]
 * @param {[type]} resolve [description]
 * @param {[type]} reject  [description]
 * @param {[type]} msg     [description]
 */
function insertItems(qry, resolve, reject, msg){
  console.log(qry);
  connection.query(qry, [], function(err, rows){
    if (err) {
      console.log(err);
      reject(err);
    } else {
      console.log('Terminó de agregar ' + msg);
      resolve();
    }
  });
}