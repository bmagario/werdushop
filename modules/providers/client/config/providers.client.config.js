(function () {
  'use strict';

  angular
    .module('providers')
    .run(menuConfig);

  menuConfig.$inject = ['Menus'];

  function menuConfig(Menus) {
  }
})();
