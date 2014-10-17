'use strict';

/**
 * @ngdoc function
 * @name frontApp.controller:PreviewShapeCtrl
 * @description
 * # PreviewShapeCtrl
 * Controller of the frontApp
 */
angular.module('frontApp')
  .controller('PreviewShapeCtrl', function ($scope,$location,preferences,features) {

    $scope.preferences = preferences;

    $scope.init = function(){
      //Si no puedo recuperar un geojson persistido, lo mando al home
      if(features.get_current() == false){
        $location.path('/');
        return;
      };

      preferences.map.addLayer(features.get_layer());

      try {
        preferences.view.fitExtent(features.get_source().getExtent());
      } catch (variable) {
        // continue;
      }
    }
    $scope.$on('map',function(){
      $scope.init();
    });
  });
