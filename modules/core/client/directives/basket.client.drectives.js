'use strict';

//Controlador para la canasta    
angular.module('core')
.directive('notificationBadge', function($timeout){
  return function(scope, elem, attrs) {
    $timeout(function() {
      elem.addClass('notification-badge');
    }, 0);
    scope.$watch(attrs.notificationBadge, function(newVal) {
      if (newVal > 0) {
        elem.attr('data-badge-count', newVal);
      } else {
        elem.removeAttr('data-badge-count');
      }
    });
  };
});