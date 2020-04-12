'use strict';

/**
 * Module dependencies.
 */
var _ = require('lodash'),
  fs = require('fs'),
  path = require('path'),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  multer = require('multer'),
  config = require(path.resolve('./config/config'));

/**
 * Update user details
 */
exports.update = function (req, res) {
  var user = req.user;
};

/**
 * Send User
 */
exports.me = function (req, res) {
  res.json(req.user || null);
};