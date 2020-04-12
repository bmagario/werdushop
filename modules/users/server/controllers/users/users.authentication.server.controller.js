'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  passport = require('passport'),
  crypto = require('crypto'),
  globals = require(path.resolve('.','./config/globals'));

// URLs for which user can't be redirected on signin
var noReturnUrls = [
  '/authentication/signin',
  '/authentication/signup'
];

/**
 * Signup
 */
exports.signup = function (req, res) {
  if (!req.body.password) {
    return res.status(400).send({
      message: 'Email o password incorrectos.'
    });
  }
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    // For security measurement we remove the roles from the req.body object
    delete req.body.roles;
    

    // Init Variables
    var user = {
      provider: 'local',
      email: req.body.email,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      display_name: req.body.first_name,
      gender: req.body.gender
    };
    user.salt = crypto.randomBytes(16).toString('base64');
    user.password = crypto.pbkdf2Sync(req.body.password, new Buffer(user.salt, 'base64'), 10000, 64).toString('base64');
    var message = null;

    connection.beginTransaction(function(err) {
      if (err) { 
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      // Se guarda el usuario.
      var qry = 'INSERT INTO user SET ? ';
      connection.query(qry, user, function(err, result) {
        if (err) {
          return connection.rollback(function(){
            return res.status(400).send({
              message: errorHandler.getErrorMessage(err)
            });
          });
        }

        //Se obtiene el id del usuario insertado.
        user.id_user = result.insertId;

        //Se inserta el rol del usuario.
        qry = 'INSERT INTO user_rol SET ? ';
        connection.query(qry, { id_user: user.id_user, id_rol: globals.ROL_USER }, function(err, result) {
          if (err) {
            return connection.rollback(function(){
              return res.status(400).send({
                message: errorHandler.getErrorMessage(err)
              });
            });
          }
          connection.commit(function(err) {
            if (err) {
              return connection.rollback(function() {
                return res.status(400).send({
                  message: errorHandler.getErrorMessage(err)
                });
              });
            }
            // Remove sensitive data before login
            user.password = undefined;
            user.salt = undefined;
            user.roles = ['user'];
            req.login(user, function (err) {
              if (err) {
                res.status(400).send(err);
              } else {
                res.json(user);
              }
            });
          });
        });
      });
    });
  });
};

/**
 * Signin after passport authentication
 */
exports.signin = function (req, res, next) {
  passport.authenticate('local', function (err, user, info) {
    if (err || !user) {
      res.status(400).send(info);
    } else {
      // Remove sensitive data before login
      user.password = undefined;
      user.salt = undefined;

      req.login(user, function (err) {
        if (err) {
          res.status(400).send(err);
        } else {
          res.json(user);
        }
      });
    }
  })(req, res, next);
};

/**
 * Signout
 */
exports.signout = function (req, res) {
  req.logout();
  res.redirect('/');
};

/**
 * OAuth provider call
 */
exports.oauthCall = function (strategy, scope) {
  return function (req, res, next) {
    // Set redirection path on session.
    // Do not redirect to a signin or signup page
    if (noReturnUrls.indexOf(req.query.redirect_to) === -1) {
      req.session.redirect_to = req.query.redirect_to;
    }
    // Authenticate
    passport.authenticate(strategy, scope)(req, res, next);
  };
};

/**
 * OAuth callback
 */
exports.oauthCallback = function (strategy) {
  return function (req, res, next) {
    // Pop redirect URL from session
    var sessionRedirectURL = req.session.redirect_to;
    delete req.session.redirect_to;

    passport.authenticate(strategy, function (err, user, redirectURL) {
      if (err) {
        return res.redirect('/authentication/signin?err=' + encodeURIComponent(errorHandler.getErrorMessage(err)));
      }
      if (!user) {
        return res.redirect('/authentication/signin');
      }
      req.login(user, function (err) {
        if (err) {
          return res.redirect('/authentication/signin');
        }
        //Return redirect url.
        return res.redirect(typeof redirectURL === 'string' ? redirectURL : sessionRedirectURL || '/');
      });
    })(req, res, next);
  };
};

/**
 * Helper function to save or update a OAuth user profile
 */
exports.saveOAuthUserProfile = function (req, providerUserProfile, done) {
  var qry = '';
  req.getConnection(function(err, connection) {
    if (err) {
      return done(err);
    }
    if (!req.user) {
      // Busco si el usuario ya está registrado con facebook.
      qry = 'SELECT id_user FROM user WHERE email = ? AND id_provider = ? ';
      connection.query(qry, [providerUserProfile.email, providerUserProfile.id_provider], function(err, users) {
        if (err) {
          return done(err);
        }

        //Si esta regitrado con facebook, retorno al usuario en cuestion.
        if(users.length){
          providerUserProfile.id_user = users[0].id_user;
          return done(null, providerUserProfile);
        } else{
          connection.beginTransaction(function(err) {
            if (err) { 
              return done(err);
            }
            // Se guarda el usuario.
            qry = 'INSERT INTO user SET ? ';
            connection.query(qry, providerUserProfile, function(err, result) {
              if (err) {
                return connection.rollback(function(){
                  return done(err);
                });
              }

              //Se obtiene el id del usuario insertado.
              providerUserProfile.id_user = result.insertId;

              //Se inserta el rol del usuario.
              qry = 'INSERT INTO user_rol SET ? ';
              connection.query(qry, { id_user: providerUserProfile.id_user, id_rol: globals.ROL_USER }, function(err, result) {
                if (err) {
                  return connection.rollback(function(){
                    return done(err);
                  });
                }
                //Se realiza el commit de la transaccion.
                connection.commit(function(err) {
                  if (err) {
                    return connection.rollback(function() {
                      return done(err);
                    });
                  }
                  // Remove sensitive data before login
                  providerUserProfile.roles = ['user'];
                  return done(null, providerUserProfile);
                });
              });
            });
          });
        }
      });
    } else {
      // User is already logged in, join the provider data to the existing user
      var user = req.user;

      // Check if user exists, is not signed in using this provider.
      if (user.id_provider !== providerUserProfile.id_provider) {
        qry = 'UPDATE INTO user SET id_provider WHERE id_user = ? ';
        connection.query(qry, [providerUserProfile.id_provider, user.id_user], function(err, result) {
          if (err) {
            return done(err);
          }
          return done(null, user, '/settings/profile');
        });
      } else {
        return done(new Error('El usuario ya está conectado utilizando facebook.'), user);
      }
    }
  });
};

/**
 * Remove OAuth provider
 */
exports.removeOAuthProvider = function (req, res, next) {
/*  var user = req.user;
  var provider = req.query.provider;

  if (!user) {
    return res.status(401).json({
      message: 'El usuario no está logueado.'
    });
  } else if (!provider) {
    return res.status(400).send();
  }

  // Delete the additional provider
  if (user.additionalProvidersData[provider]) {
    delete user.additionalProvidersData[provider];

    // Then tell mongoose that we've updated the additionalProvidersData field
    user.markModified('additionalProvidersData');
  }

  user.save(function (err) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    } else {
      req.login(user, function (err) {
        if (err) {
          return res.status(400).send(err);
        } else {
          return res.json(user);
        }
      });
    }
  });*/
};