(function () {
  'use strict';
  angular.module('core')
  .factory('FilesService', ['$http', function($http){
    var filesService = {};

    filesService.downloadDeliveries = function (ajax_params) {
      var downloadRequest = {
        method: 'post',
        url: '/api/download_deliveries' ,
        data: ajax_params,
        headers: {
          'Content-type': 'application/json'
        },
        responseType: 'arraybuffer'
      };

      return $http(downloadRequest);
    };

    filesService.downloadDeliveriesPanel = function (ajax_params) {
      var downloadRequest = {
        method: 'post',
        url: '/api/download_deliveries_panel' ,
        data: ajax_params,
        headers: {
          'Content-type': 'application/json'
        },
        responseType: 'arraybuffer'
      };

      return $http(downloadRequest);
    };


    return filesService;
  }]);
})();
