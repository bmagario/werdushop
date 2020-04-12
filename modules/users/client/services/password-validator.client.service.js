'use strict';

// PasswordValidator service used for testing the password strength
angular.module('users').factory('PasswordValidator', ['$window',
  function ($window) {
    var owaspPasswordStrengthTest = $window.owaspPasswordStrengthTest;

    return {
      getResult: function (password) {
        var result = owaspPasswordStrengthTest.test(password);
        return result;
      },
      getPopoverMsg: function () {
        var popoverMsg = 'Por favor, ingrese una contraseña con 10 caracteres como mínimo, incluyendo números, letras en mayúscula o minúscula, y signos de puntuación';
        return popoverMsg;
      }
    };
  }
]);
