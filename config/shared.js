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
  shared = require(path.resolve('.','./config/shared')),
  nodemailer = require('nodemailer');
var smtpTransport = nodemailer.createTransport(config.mailer.options);
var Excel = require('exceljs');

/**
 * Funcion para enviar emails utilizando nodemailer.
 * @param  {[string]} emailHTML   [description]
 * @param  {[string]} subject     [description]
 * @param  {[string]} to          [description]
 * @param  {[array]} attachments [description]
 * @return {[type]}             [description]
 */
module.exports.send_email = function send_email(emailHTML, subject, to, attachments) {
  if(attachments === undefined){
    attachments = [];
  }
  var mailOptions = {
    to: to,
    from: config.mailer.from,
    subject: subject,
    html: emailHTML,
    service: config.mailer.service,
    auth: config.mailer.auth,
    attachments: attachments
  };
  console.log('********************* ENVIO EMAIL *********************');
  console.log('subject: ' + mailOptions.subject);
  console.log('from: ' + mailOptions.from);
  console.log('to: ' + mailOptions.to);
  console.log('*******************************************************');
  smtpTransport.sendMail(mailOptions, function (err) {
    if (!err) {
      console.log('OK envío de email.');
    } else {
      console.log('ERROR envío de email. ' + err);
    }
  });
};

module.exports.send_email_jsonp = function send_email_jsonp(res, emailHTML, subject, sender, from, attachments) {
  if(attachments === undefined){
    attachments = [];
  }
  var mailOptions = {
    to: config.mailer.from,
    sender: sender,
    from: from,
    subject: subject,
    html: emailHTML,
    service: config.mailer.service,
    auth: config.mailer.auth,
    attachments: attachments
  };
  console.log('********************* ENVIO EMAIL *********************');
  console.log('subject: ' + mailOptions.subject);
  console.log('from: ' + mailOptions.from);
  console.log('to: ' + mailOptions.to);
  console.log('*******************************************************');
  smtpTransport.sendMail(mailOptions, function (err) {
    var msg = '';
    var error = false;
    if (err) {
      console.log(err);
      msg = 'Error al enviar el mensaje de contacto.';
      error = true;
      res.jsonp([{ error: error, msg: msg }]);
      return;
    } else {
      msg = 'TODO OK';
      error = false;
      res.jsonp([{ error: error, msg: msg }]);
      return;
    }
  });
};


module.exports.write_xlsx = function write_xlsx(path, filename, header, data) {
  var workbook = createAndFillWorkbook(name);
  workbook.xlsx.writeFile(filename)
  .then(function() {
    // done
  });

  // write to a stream
/*  workbook.xlsx.write(stream)
  .then(function() {
    // done
  });*/
};

function createAndFillWorkbook(name){
/*  var workbook = new Excel.Workbook();
  workbook.creator = 'Werdulero';
  workbook.lastModifiedBy = 'Werdulero';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.views = [
    {
      x: 0, y: 0, width: 10000, height: 20000,
      firstSheet: 0, activeTab: 1, visibility: 'visible'
    }
  ];
  var sheet = workbook.addWorksheet(name);*/
}

/**
 * Realiza el control de los campos del detalle de un articulo de una orden de compra.
 * @param  {[type]} article [description]
 * @return {[type]}         [description]
 */
module.exports.controlCargaOrdenCompra = function controlCargaOrdenCompra(article){
  var total_dirty = parseFloat(article.total_dirty);
  var total_waste = parseFloat(article.total_waste);
  var total_clean = parseFloat(article.total_clean);
  var total_price = parseFloat(article.total_price);
  var price = parseFloat(article.price);
  if(isNaN(total_dirty) || total_dirty <= 0 ||
    isNaN(total_waste) || total_waste < 0 ||
    isNaN(total_clean) || total_clean <= 0 ||
    isNaN(total_price) || total_price <= 0 ||
    isNaN(price) || price <= 0){
    return globals.ERROR;
  } else if(article.amount > 0 && article.amount > article.total_clean){
    return globals.WARNING;
  }
  return globals.OK;
};

/**
 * Realiza el control de los campos del detalle de un articulo de una orden de relevamiento.
 * @param  {[type]} article [description]
 * @return {[type]}         [description]
 */
module.exports.controlCargaOrdenRelevamiento = function controlCargaOrdenRelevamiento(article){
  var total_surveyed = parseFloat(article.total_surveyed);
  var total_price = parseFloat(article.total_price);
  var price = parseFloat(article.price);
  if(isNaN(total_surveyed) || total_surveyed <= 0 ||
    isNaN(total_price) || total_price <= 0 ||
    isNaN(price) || price <= 0){
    return globals.ERROR;
  }
  return globals.OK;
};
