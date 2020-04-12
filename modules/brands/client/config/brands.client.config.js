(function () {
  'use strict';

  angular
    .module('brands')
    .run(menuConfig);

  menuConfig.$inject = ['Menus'];

  function menuConfig(Menus) {
    // Add the dropdown list item
    Menus.addSubMenuItem('leftbar', 'config', {
      title: 'Listado de Marcas',
      state: 'brands.list'
    });

    // Add the dropdown create item
    Menus.addSubMenuItem('leftbar', 'config', {
      title: 'Agregar Marca',
      state: 'brands.create',
      roles: ['admin']
    });
  }
})();