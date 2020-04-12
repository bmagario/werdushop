'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  path = require('path'),
  shared = require(path.resolve('.','./config/shared')),
  globals = require(path.resolve('.','./config/globals')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  multer = require('multer'),
  config = require(path.resolve('./config/config'));

/**
* Get a User Address
*/
exports.send_contact = function (req, res) {
  var ip = req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  var emailHTML = '<p>Nombre: ' + req.body.firstName + '</p>' +
                  '<p>Apellido: ' + req.body.lastName + '</p>' +
                  '<p>Email: ' + req.body.email + '</p>' +
                  '<p>Teléfono: (' + req.body.phone.areaCode + ') ' + req.body.phone.number + '</p>' +
                  '<p>Message: ' + req.body.message + '</p>' +
                  '<p>IP: ' + ip + '</p>';
  var subject = 'Contacto Werdulero - ' + req.body.subject;
  var sender = req.body.email;
  var from = req.body.firstName + ' ' + req.body.lastName + ' <' + req.body.email + '>';

  return shared.send_email_jsonp(res, emailHTML, subject, sender, from);
};
