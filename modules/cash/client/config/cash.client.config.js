(function () {
  'use strict';

  angular
    .module('cash')
    .run(menuConfig);

  menuConfig.$inject = ['Menus'];

  function menuConfig(Menus) {
  }
})();
