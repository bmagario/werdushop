//Subgroups service used to communicate Subgroups REST endpoints
(function () {
  'use strict';

  angular
    .module('subgroups')
    .factory('SubgroupsService', SubgroupsService);

  SubgroupsService.$inject = ['$resource'];

  function SubgroupsService($resource) {
    return $resource('api/subgroups/:subgroupId', {
      subgroupId: '@id_subgroup'
    }, {
      update: {
        method: 'PUT'
      }
    });
  }
})();