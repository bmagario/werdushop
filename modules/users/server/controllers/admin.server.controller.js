'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  globals = require(path.resolve('.','./config/globals')),
  mysql_helper = require(path.resolve('.','./config/mysql_helper')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller'));

/**
 * Show the current user
 */
exports.read = function (req, res) {
  res.json(req.model);
};

/**
 * Update a User
 */
exports.update = function (req, res) {
  var user = req.model;
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    var user_update = {
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      display_name: req.body.first_name, 
      id_status: req.body.id_status
    };
    /*user.roles = req.body.roles;*/
    var qry = 'UPDATE user SET ?, modified = NOW() WHERE id_user = ?;';
    connection.query(qry, [user_update, user.id_user], function(err, result) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.jsonp(user);
    });
  });
};

/**
 * Delete a user
 */
exports.delete = function (req, res) {
  var user = req.model;
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }

    var qry = 'UPDATE user SET id_status = ?, modified = NOW() WHERE id_user = ?; ';
    connection.query(qry, [globals.NO_ACTIVO, user.id_user], function(err, result) {
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      user.id_status = globals.NO_ACTIVO;
      res.jsonp(user);
    });
  });
};

/**
 * List of Users
 */
exports.list = function (req, res) {
  req.getConnection(function(err, connection) {
    if (err) {
      return res.status(400).send({
        message: errorHandler.getErrorMessage(err)
      });
    }
    var qry_callback = '';
    var qry = '';
    qry += 'SELECT ';
    qry += '  u.id_user, ';
    qry += '  u.display_name, ';
    qry += '  u.first_name, ';
    qry += '  u.last_name, ';
    qry += '  u.gender, ';
    qry += '  u.email, ';
    qry += '  u.id_status, ';
    qry += '  u.created, ';
    qry += '  u.id_provider, ';
    qry += '  u.provider, ';
    qry += '  GROUP_CONCAT(r.name SEPARATOR ",") roles, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  user u ';
    qry += '  JOIN user_rol ur USING(id_user) ';
    qry += '  JOIN rol r USING(id_rol) ';
    qry += '  JOIN status st USING(id_status) ';
    qry += 'GROUP BY u.id_user ';
    qry += 'ORDER BY u.created DESC;';
    qry_callback = connection.query(qry, [], function(err, users) {
      console.log(qry_callback.sql);
      if (err) {
        return res.status(400).send({
          message: errorHandler.getErrorMessage(err)
        });
      }
      res.jsonp(users);
    });
  });
};

/**
 * User middleware
 */
exports.userByID = function (req, res, next, id_user) {
  req.getConnection(function(err, connection) {
    if (err) {
      return next(err);
    }
    var qry = '';
    qry += 'SELECT ';
    qry += '  u.id_user, ';
    qry += '  u.display_name, ';
    qry += '  u.first_name, ';
    qry += '  u.last_name, ';
    qry += '  u.gender, ';
    qry += '  u.email, ';
    qry += '  u.id_status, ';
    qry += '  u.created, ';
    qry += '  u.id_provider, ';
    qry += '  u.provider, ';
    qry += '  st.name status_name ';
    qry += 'FROM ';
    qry += '  user u ';
    qry += '  JOIN status st USING(id_status) ';
    qry += 'WHERE ';
    qry += '  u.id_user = ?;';
    connection.query(qry, [id_user], function(err, users) {
      if (err) {
        return next(err);
      } else if (!users.length) {
        return res.status(404).send({
          message: 'No se ha encontrado al usuario.'
        });
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
        req.model = user;
        next();
      });
    });
  });
};