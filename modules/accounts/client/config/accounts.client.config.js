(function () {
  'use strict';

  angular
    .module('accounts')
    .run(menuConfig);

  menuConfig.$inject = ['Menus'];

  function menuConfig(Menus) {
  }
})();
