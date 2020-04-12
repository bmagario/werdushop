(function () {
  'use strict';

  angular
    .module('subgroups')
    .run(menuConfig);

  menuConfig.$inject = ['Menus'];

  function menuConfig(Menus) {
    // Set top bar menu items
   /* Menus.addMenuItem('leftbar', {
      title: 'Subgrupos',
      state: 'subgroups',
      type: 'dropdown',
      roles: ['admin']
    });*/

    // Add the dropdown list item
    Menus.addSubMenuItem('leftbar', 'config', {
      title: 'Listado de Subrupos',
      state: 'subgroups.list',
      roles: ['admin']
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('leftbar', 'config', {
      title: 'Crear Subgrupo',
      state: 'subgroups.create',
      roles: ['admin']
    });
  }
})();