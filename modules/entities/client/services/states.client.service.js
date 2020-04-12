'use strict';
angular.module('core').factory('StatesService', ['globals', '$resource',
  function (globals, $resource) {
    var states = $resource('api/states/:stateId');

    return {
      getStates: function () {
        var result = [
          { 'id_status': 1, 'name': 'ACTIVO' },
          { 'id_status': 2, 'name': 'NO_ACTIVO' },
          { 'id_status': 3, 'name': 'SUSPENDIDO' }
        ];
        return result;
      },
      getStatesFilter: function () {
        var result = [
          { 'id': 0, 'title': 'Todos' },
          { 'id': 1, 'title': 'ACTIVO' },
          { 'id': 2, 'title': 'NO_ACTIVO' },
          { 'id': 3, 'title': 'SUSPENDIDO' }
        ];
        return result;
      },
      getStatesArticles: function () {
        var result = [
          { 'id_status': 1, 'name': 'ACTIVO' },
          { 'id_status': 2, 'name': 'NO_ACTIVO' },
          { 'id_status': 3, 'name': 'SUSPENDIDO' },
          { 'id_status': 4, 'name': 'SUSPENDIDO_TEMPORADA' }
        ];
        return result;
      },
      getStatesArticlesFilter: function () {
        var result = [
          { 'id': 0, 'title': 'Todos' },
          { 'id': 1, 'title': 'ACTIVO' },
          { 'id': 2, 'title': 'NO_ACTIVO' },
          { 'id': 3, 'title': 'SUSPENDIDO' },
          { 'id': 4, 'title': 'SUSPENDIDO_TEMPORADA' }
        ];
        return result;
      } ,
      getStatesBasketFilter: function () {
        var result = [
          { 'id': 0, 'title': 'Todos' },
          { 'id': 7, 'title': 'PENDIENTE ENTREGA' },
        ];
        return result;
      } ,
      getStatesBasketParametersFilter: function () {
        var result = [
          { 'id': 0, 'title': 'Todos' },
          { 'id': 1, 'title': 'ACTIVO' },
          { 'id': 2, 'title': 'NO_ACTIVO' },
        ];
        return result;
      } ,
      getStatesPurchasesFilter: function () {
        var result = [
          { 'id': 0, 'title': 'Todos' },
          { 'id': 9, 'title': 'OC ACTIVA' },
          { 'id': 10, 'title': 'OC FINALIZADA' }
        ];
        return result;
      } ,
      getAccountTypes: function () {
        var result = [
          { 'account_type': globals.INGRESO, 'description': 'INGRESO' },
          { 'account_type': globals.EGRESO, 'description': 'EGRESO' }
        ];
        return result;
      },
      getAccountTypesFilter: function () {
        var result = [
          { 'id': 0, 'title': 'Todos' },
          { 'id': globals.INGRESO, 'title': 'INGRESO' },
          { 'id': globals.EGRESO, 'title': 'EGRESO' }
        ];
        return result;
      }
    };
  }
]);
