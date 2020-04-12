//Groups service used to communicate Groups REST endpoints
(function () {
  'use strict';

  angular
    .module('groups')
    .factory('GroupsService', ['$resource',
    function($resource) {
      return $resource('api/groups/:groupId', {
        groupId: '@id_group'
      }, {
        update: {
          method: 'PUT'
        }
      });
    }
  ]);
})();