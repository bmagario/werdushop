'use strict';

angular
  .module('core.admin')
  .run(['Menus',
  function (Menus) {
    Menus.addMenuItem('leftbar', {
      title: 'Administración',
      state: 'admin',
      type: 'dropdown',
      roles: ['admin']
    });

/*    Menus.addMenuItem('leftbar', {
      title: 'Mis pedidos',
      state: 'user',
      type: 'home',
      roles: ['*']
    });*/
  }
]);
