'use strict';

/**
 * @ngdoc function
 * @name frontApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the frontApp
 */
angular.module('frontApp')
  .controller('MainCtrl', function ($scope,$modal) {
    $scope.ayuda = function(){
      var modalInstance = $modal.open({
        templateUrl: 'views/ayuda.html',
        controller: 'AyudaCtrl',
        resolve: {

        }
      });

      modalInstance.result.then(function () {

      }, function () {
        $log.info('Modal dismissed at: ' + new Date());
      });
    };
  });
