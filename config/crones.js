'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  async = require('async'),
  globals = require(path.resolve('.','./config/globals')),
  processes = require(path.resolve('.','./config/processes')),
  config = require(path.resolve('./config/config')),
  _ = require('lodash'),
  CronJob = require('cron').CronJob;

module.exports.start = function start() {
  generateDailyCash();
  generatePurchaseOrder();
  generateSurveyOrder();
};

/**
  * * * * * *
  | | | | | +---- Day of the Week   (range: 0-6, 0 standing for Sunday)
  | | | | +------ Month of the Year (range: 1-12)
  | | | +-------- Day of the Month  (range: 1-31)
  | | +---------- Hour              (range: 0-23)
  | +------------ Minute            (range: 0-59)
  +-------------- Second            (range: 0-59)
*/
function generatePurchaseOrder(){
  new CronJob('50 30 06 * * *', function() {
    var zonas = [{
      id_location: globals.LOCATIONS.BAHIA_BLANCA,
      location_desc: 'Bahía Blanca',
      id_zone: globals.ZONES.BAHIA_BLANCA_1,
      zone_desc: 'Zona 1 (Bahía Blanca)'
    }];
    async.eachSeries(zonas, function(zona, callback) {
      var id_location = zona.id_location;
      var location_desc = zona.location_desc;
      var id_zone = zona.id_zone;
      var zone_desc = zona.zone_desc;
      processes.generatePurchaseOrder(id_location, location_desc, id_zone, zone_desc, callback);
    }, function(err) {
      if(err) {
        console.log('ERROR generatePurchaseOrder(): Final Callback' + err);
      } else{
        console.log('OK generatePurchaseOrder(): Final Callback');
      }
    });
  }, null, true, 'America/Argentina/Buenos_Aires');
}

function generateSurveyOrder(){
  new CronJob('40 55 19 * * 3', function() {
    var localidades = [{
      id_location: globals.LOCATIONS.BAHIA_BLANCA,
      location_desc: 'Bahía Blanca'
    }];
    async.eachSeries(localidades, function(localidad, callback) {
      var id_location = localidad.id_location;
      var location_desc = localidad.location_desc;
      processes.generateSurveyOrder(id_location, location_desc, callback);
    }, function(err) {
      if(err) {
        console.log('ERROR generateSurveyOrder(): Final Callback' + err);
      } else{
        console.log('OK generateSurveyOrder(): Final Callback');
      }
    });
  }, null, true, 'America/Argentina/Buenos_Aires');
}

function generateDailyCash(){
  new CronJob('00 00 06 * * 1-5', function() {
    var zonas = [{
      id_location: globals.LOCATIONS.BAHIA_BLANCA,
      location_desc: 'Bahía Blanca',
      id_zone: globals.ZONES.BAHIA_BLANCA_1,
      zone_desc: 'Zona 1 (Bahía Blanca)'
    }];
    async.eachSeries(zonas, function(zona, callback) {
      var id_location = zona.id_location;
      var location_desc = zona.location_desc;
      var id_zone = zona.id_zone;
      var zone_desc = zona.zone_desc;
      processes.generateDailyCash(id_location, location_desc, id_zone, zone_desc, callback);
    }, function(err) {
      if(err) {
        console.log('ERROR generateDailyCash(): Final Callback' + err);
      } else{
        console.log('OK generateDailyCash(): Final Callback');
      }
    });
  }, null, true, 'America/Argentina/Buenos_Aires');
}
