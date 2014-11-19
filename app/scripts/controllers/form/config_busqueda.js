'use strict';

/**
 * @ngdoc function
 * @name frontApp.controller:FormConfigBusquedaCtrl
 * @description
 * # FormConfigBusquedaCtrl
 * Controller of the frontApp
 */
angular.module('frontApp')
  .controller('FormConfigBusquedaCtrl', function ($scope,$modalInstance,preferences) {
    $scope.preferences = preferences;
    $scope.ok = function () {
      preferences.persistir();
      $modalInstance.close();
    };

    $scope.cancel = function () {
      preferences.init();
      $modalInstance.dismiss();
    };
  });
