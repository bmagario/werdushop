(function () {
  'use strict';
  angular.module('core')
  .factory('PaymentMethodsService', ['globals', '$resource', '$q', function(globals, $resource, $q){
    var url, defaultParams, actions;
    url = '';
    defaultParams = {};
    actions = {
      getPaymentMethods: { url: '/api/payment_methods/', method: 'GET', isArray: true },
    };
    var recurso = $resource(url, defaultParams, actions);

    var PaymentMethodsService = {};

    PaymentMethodsService.getPaymentMethodsPago = function(){
      var deferred = $q.defer();
      recurso.getPaymentMethods({ payment_type: globals.PAYMENT_METHOD_PAGO })
      .$promise.then(function (result) {
        deferred.resolve(result);
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise;
    };

    PaymentMethodsService.getPaymentMethodsCobro = function(){
      var deferred = $q.defer();
      recurso.getPaymentMethods({ payment_type: globals.PAYMENT_METHOD_COBRO })
      .$promise.then(function (result) {
        deferred.resolve(result);
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise;
    };

    PaymentMethodsService.getPaymentMethodsAmbos = function(){
      var deferred = $q.defer();
      recurso.getPaymentMethods({ payment_type: globals.PAYMENT_METHOD_AMBOS }).$promise.then(function (result) {
        deferred.resolve(result);
      }, function(error) {
        deferred.reject(error);
      });
      return deferred.promise;
    };

    return PaymentMethodsService;
  }]);
})();
