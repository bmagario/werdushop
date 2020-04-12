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
* CANTIDAD DE DIRECCIONES DE ENTREGA
*/

//Cantidad de direcciones que puede almacenar como máximo un usuaroio
exports.get_count_address = function(req, res) {

  return globals.CANTIDAD_MAX_DIRECCIONES;
};
