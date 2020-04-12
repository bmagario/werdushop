'use strict';

/**
 * Module dependencies.4
 * estrategia de autenticación con passport local (con usuario y contraseña)
 */
var passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  crypto = require('crypto'),
  validator = require('validator'),
  generatePassword = require('generate-password'),
  owasp = require('owasp-password-strength-test'),
  path = require('path'),
  globals = require(path.resolve('.','./config/globals')),
  config = require(path.resolve('.','./config/config')),
  mysql = require('mysql'),
  connection = mysql.createConnection(config.mydb);

module.exports = function () {
  // Use local strategy
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  },
  function (email, password, done) {
    connection.query('SELECT * FROM user WHERE email = ?', [email], function(err, users){
      if (err){
        return done(err);
      }
      if (!users.length) {//No existe el usuario.
        return done(null, false, {
          message: 'Email o Contraseña no válidos.' //usuario desconocido o contraseña inválida
        });
      }
      var user = users[0];
      //No coinciden las contraseñas.
      if (user.password !== crypto.pbkdf2Sync(password, new Buffer(user.salt, 'base64'), 10000, 64).toString('base64')){
        return done(null, false, {
          message: 'Email o Contraseña no válidos.' //usuario desconocido o contraseña inválida
        });
      }
      var qry = 'SELECT r.name FROM user_rol ur JOIN rol r USING(id_rol) WHERE ur.id_user = ? ';
      connection.query(qry, [user.id_user], function(err, roles) {
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
        user.roles = user_roles;
        return done(null, user);
      });
    });
  }));
};