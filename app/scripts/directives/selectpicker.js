'use strict';

/**
 * @ngdoc directive
 * @name frontApp.directive:selectpicker
 * @description
 * # selectpicker
 */
angular.module('frontApp')
    .directive('selectpicker', function () {
    return {
      restrict: 'A',
      link: function postLink(scope, element, attrs) {
        element.selectpicker();
      }
    };
  });
