'use strict';

/**
 * Get unique error field name
 */
var getUniqueErrorMessage = function (err) {
  var output;
  try {
    var fieldName = err.errmsg.substring(err.errmsg.lastIndexOf('.$') + 2, err.errmsg.lastIndexOf('_1'));
    output = fieldName.charAt(0).toUpperCase() + fieldName.slice(1) + ' ya existe';
  } catch (ex) {
    output = 'Campo único ya existe.';
  }
  return output;
};

/**
 * Get the error message from error object
 */
exports.getErrorMessage = function (err) {
  var message = '';

  if (err.code) {
    switch (err.code) {
      case 11000:
      case 11001:
        message = getUniqueErrorMessage(err);
        console.log(err);
        break;
      default:
        message = 'Algo anda mal';
        console.log(err);
    }
  } else {
    for (var errName in err.errors) {
      if (err.errors[errName].message) {
        message = err.errors[errName].message;
      }
    }
  }

  return message;
};