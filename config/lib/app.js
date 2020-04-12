'use strict';

/**
 * Module dependencies.
 */
var config = require('../config'),
  crones = require('../crones'),
  express = require('./express'),
  chalk = require('chalk'),
  seed = require('./seed');
  
function seedDB() {
  if (config.seedDB && config.seedDB.seed) {
    console.log(chalk.bold.red('Warning:  Database seeding is turned on'));
    seed.start();
  }
}


module.exports.init = function init(callback) {
  var app = express.init();
  if (callback) callback(app, config);
};

module.exports.start = function start(callback) {
  var _this = this;

  _this.init(function (app, config) {

    // Start the app by listening on <port>
    app.listen(config.port, function () {

      // Logging initialization
      console.log('--');
      console.log(chalk.green(config.app.title));
      console.log(chalk.green('Environment:\t\t\t' + process.env.NODE_ENV));
      console.log(chalk.green('Port:\t\t\t\t' + config.port));
      console.log(chalk.green('Database:\t\t\t\t' + config.mydb.host));
      console.log(chalk.green('Database:\t\t\t\t' + config.mydb.port));
      console.log(chalk.green('Database:\t\t\t\t' + config.mydb.user));
      console.log(chalk.green('Database:\t\t\t\t' + config.mydb.database));
      if (process.env.NODE_ENV === 'secure') {
        console.log(chalk.green('HTTPs:\t\t\t\ton'));
      }
      console.log('--');
      seedDB();

      //Acivar tareas programadas.
      crones.start();

      if (callback) callback(app, config);
    });

  });
};