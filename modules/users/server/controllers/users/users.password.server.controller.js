'use strict';

/**
 * Module dependencies.
 */
var path = require('path'),
  config = require(path.resolve('./config/config')),
  errorHandler = require(path.resolve('./modules/core/server/controllers/errors.server.controller')),
  nodemailer = require('nodemailer'),
  async = require('async'),
  crypto = require('crypto');

var smtpTransport = nodemailer.createTransport(config.mailer.options);

/**
 * Forgot for reset password (forgot POST)
 */
exports.forgot = function (req, res, next) {

};

/**
 * Reset password GET from email token
 */
exports.validateResetToken = function (req, res) {

};

/**
 * Reset password POST from email token
 */
exports.reset = function (req, res, next) {

};

/**
 * Change Password
 */
exports.changePassword = function (req, res, next) {
};