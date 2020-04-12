'use strict';
var userPolicy = require('../policies/user.server.policy'),
  users = require('../controllers/users.server.controller');   // User Routes

module.exports = function (app) {

  // Setting up the users profile api
  app.route('/api/users/me').all(userPolicy.isAllowed)
    .get(users.me);

  app.route('/api/users').all(userPolicy.isAllowed)
    .put(users.update);

  app.route('/api/users/address').all(userPolicy.isAllowed)
    .post(users.update_address)
    .get(users.get_address);

  app.route('/api/users/remove_address').all(userPolicy.isAllowed)
    .post(users.remove_address);

  app.route('/api/users/accounts').all(userPolicy.isAllowed)
    .delete(users.removeOAuthProvider);

  app.route('/api/users/password').all(userPolicy.isAllowed)
    .post(users.changePassword);

  app.route('/api/users/contact').all(userPolicy.isAllowed)
    .post(users.send_contact);

  // Finish by binding the user middleware
  app.param('idUser', users.userByID);
};
