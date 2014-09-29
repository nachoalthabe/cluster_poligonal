'use strict';

/**
 * @ngdoc function
 * @name frontApp.controller:AyudaCtrl
 * @description
 * # AyudaCtrl
 * Controller of the frontApp
 */
angular.module('frontApp')
  .controller('AyudaCtrl', function ($scope,$modalInstance) {
    $scope.cerrar= function(){
      $modalInstance.close();
    }

    $scope.contacto= function(){
      alert('Formulario de contacto. ToDo')
      $modalInstance.close();
    }
  });
