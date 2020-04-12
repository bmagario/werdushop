'use strict';

angular.module('core').filter('inArray', function() { return function (array, needle) { if(array){ return array.indexOf(parseInt(needle)) !== -1;	} else{ return false;	} }; });