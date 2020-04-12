'use strict';

// Configuring the Articles module
angular.module('users.admin').run(['Menus',
  function (Menus) {
    Menus.addSubMenuItem('leftbar', 'admin', {
      title: 'Gestión de usuarios',
      state: 'admin.users'
    });
  }
]);