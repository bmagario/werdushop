'use strict';

/**
 * Module dependencies.
 */
var passport = require('passport'),
  FacebookStrategy = require('passport-facebook').Strategy,
  users = require('../../controllers/users.server.controller');

module.exports = function (config) {
  // Use facebook strategy
  passport.use(new FacebookStrategy({
    clientID: config.facebook.clientID,
    clientSecret: config.facebook.clientSecret,
    callbackURL: config.facebook.callbackURL,
    profileFields: ['id', 'name', 'gender', 'displayName', 'emails'],
    passReqToCallback: true
  },
  function (req, accessToken, refreshToken, profile, done) {
    // Set the provider data and include tokens
    var providerData = profile._json;
    providerData.access_token = accessToken;
    providerData.refresh_token = refreshToken;

    var gender = '';
    if(profile.gender === 'male'){
      gender = 'Hombre';
    } else if(profile.gender === 'female'){
      gender = 'Mujer';
    }
    // Create the user OAuth profile
    var providerUserProfile = {
      first_name: profile.name.givenName,
      last_name: profile.name.familyName,
      display_name: profile.name.givenName,
      email: profile.emails ? profile.emails[0].value : undefined,
      provider: 'facebook',
      id_provider: profile.id,
      access_token: accessToken,
      refresh_token: refreshToken,
      gender: gender
    };

    // Save the user OAuth profile
    users.saveOAuthUserProfile(req, providerUserProfile, done);
  }));
};