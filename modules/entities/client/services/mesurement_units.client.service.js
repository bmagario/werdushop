//MeasurementUnitService service used to communicate MeasurementUnitService REST endpoints
(function () {
  'use strict';

  angular
    .module('core')
    .factory('MeasurementUnitsService', MeasurementUnitsService);

  MeasurementUnitsService.$inject = ['$resource'];

  function MeasurementUnitsService($resource) {
    return $resource('api/measurement_units');
  }
})();