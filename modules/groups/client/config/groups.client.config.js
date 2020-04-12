(function () {
  'use strict';

  angular
    .module('groups')
    .run(menuConfig);

  menuConfig.$inject = ['Menus'];

  function menuConfig(Menus) {
    // Set top bar menu items
    /* Menus.addMenuItem('topbar', {
      title: 'Frutas',
      state: 'home.frutas',
      type: 'dropdown',
      roles: ['admin']
    });*/


   /* Menus.addMenuItem('leftbar', {
      title: 'Grupos',
      state: 'groups',
      type: 'dropdown',
      roles: ['admin']
    });*/

    // Add the dropdown list item
    Menus.addSubMenuItem('leftbar', 'config', {
      title: 'Listado de Grupos',
      state: 'groups.list',
      roles: ['admin']
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('leftbar', 'config', {
      title: 'Crear Grupo',
      state: 'groups.create',
      roles: ['admin']
    });
  }
})();