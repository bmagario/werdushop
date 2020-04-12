'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
  path = require('path'),
  globals = require(path.resolve('.','./config/globals')),
  config = require(path.resolve('./config/config')),
  mysql = require('mysql'),
  connection = mysql.createConnection(config.mydb);

/**
 * Module init function.
 */
module.exports = function (app) {
  // Serialize sessions
  passport.serializeUser(function (user, done) {
    done(null, user.id_user);
  });

  // Deserialize sessions
  passport.deserializeUser(function (id_user, done) {
    var qry = 'SELECT * FROM user WHERE id_user = ? ';
    connection.query(qry, [id_user], function(err, users) {
      //Check if some error occurs.
      if (err) {
        return done(err);
      }
      var qry = 'SELECT r.name FROM user_rol ur JOIN rol r USING(id_rol) WHERE ur.id_user = ? ';
      connection.query(qry, [id_user], function(err, roles) {
        if (err) {
          return done(err);
        } else if (!roles.length) {
          return done(null, false, {
            message: 'Email o Contraseña no válidos.' //usuario desconocido o contraseña inválida
          });
        }
        var user_roles = roles.map(function(rol){
          return rol.name;
        });
        var user = users[0];
        user.roles = user_roles;
        return done(null, user);
      });
    });
  });

  // Initialize strategies
  config.utils.getGlobbedPaths(path.join(__dirname, './strategies/**/*.js')).forEach(function (strategy) {
    require(path.resolve(strategy))(config);
  });

  // Add passport's middleware
  app.use(passport.initialize());
  app.use(passport.session());
};
