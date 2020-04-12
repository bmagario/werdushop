'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  globals = require(path.resolve('.','./config/globals')),
  _ = require('lodash');


/**
 * User middleware
 */
exports.userByID = function (req, res, next, id_user) {
  req.getConnection(function(err, connection) {
    if (err) {
      return next(err);
    }
    var qry = 'SELECT * FROM user WHERE id_user = ? ';
    connection.query(qry, [id_user], function(err, users) {
      if (err) {
        return next(err);
      } else if (!users.length) {
        return next(new Error('Error al cargar el usuario ' + id_user));
      }
      var qry = 'SELECT r.name FROM user_rol ur JOIN rol r USING(id_rol) WHERE ur.id_user = ? ';
      connection.query(qry, [id_user], function(err, roles) {
        if (err) {
          return next(err);
        } else if (!roles.length) {
          return res.status(404).send({
            message: 'No se ha encontrado al usuario.'
          });
        }
        var user_roles = roles.map(function(rol){ 
          return rol.name;
        });
        var user = users[0];
        user.roles = user_roles;
        req.profile = user;
        next();
      });
    });
  });
};