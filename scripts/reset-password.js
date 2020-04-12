'use strict';

var nodemailer = require('nodemailer'),
  mongoose = require('mongoose'),
  chalk = require('chalk'),
  config = require('../config/config'),
  mg = require('../config/lib/mongoose');

var transporter = nodemailer.createTransport(config.mailer.options);
var link = 'reset link here'; // PUT reset link here
var email = {
  from: config.mailer.from,
  subject: 'Restablecimiento seguro'
};
var text = [
  'Estimada/o {{name}},',
  '\n',
  'Hemos modificado el almacenamiento de las contraseñas para que sea más seguro, por favor has click en el link de abajo para restablecer tu contraseña para futuros ingresos.',
  link,
  '\n',
  'Thanks,',
  'The Team'
].join('\n');

mg.loadModels();

mg.connect(function (db) {
  var User = mongoose.model('User');

  User.find().exec(function (err, users) {
    if (err) {
      throw err;
    }

    var processedCount = 0,
      errorCount = 0;

    // report and exit if no users were found
    if (users.length === 0) {
      return reportAndExit(processedCount, errorCount);
    }

    for (var i = 0; i < users.length; i++) {
      sendEmail(users[i]);
    }

    function sendEmail(user) {
      email.to = user.email;
      email.text = email.html = text.replace('{{name}}', user.displayName);

      transporter.sendMail(email, emailCallback(user));
    }

    function emailCallback(user) {
      return function (err, info) {
        processedCount++;

        if (err) {
          errorCount++;

          if (config.mailer.options.debug) {
            console.log('Error: ', err);
          }
          console.error('[' + processedCount + '/' + users.length + '] ' + chalk.red('No fue posible enviar el email para ' + user.displayName));
        } else {
          console.log('[' + processedCount + '/' + users.length + '] El email de restablecimiento de contraseña fue enviado para ' + user.displayName);
        }

        if (processedCount === users.length) {
          return reportAndExit(processedCount, errorCount);
        }
      };
    }

    // report the processing results and exit
    function reportAndExit(processedCount, errorCount) {
      var successCount = processedCount - errorCount;

      console.log();

      if (processedCount === 0) {
        console.log(chalk.yellow('No se han encontrado usuarios.'));
      } else {
        var alert = (!errorCount) ? chalk.green : ((successCount / processedCount) < 0.8) ? chalk.red : chalk.yellow;

        console.log(alert('Sent ' + successCount + ' of ' + processedCount + ' emails successfully.'));
      }

      process.exit(0);
    }
  });
});
