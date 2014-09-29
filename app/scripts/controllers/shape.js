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

      $scope.source = features.get_source();
      $scope.layer = features.get_layer();

      preferences.view = new ol.View({
        center: ol.proj.transform([0,0], 'EPSG:4326', 'EPSG:3857'),
        zoom: 4,
        projection: 'EPSG:3857'
      });

      $scope.map = new ol.Map({
        target: 'map',
        layers: [
          new ol.layer.Tile({
            source: new ol.source.OSM()
          }),
          $scope.layer
        ],
        view: preferences.view
      });

      preferences.setMap($scope.map);


      try {
        preferences.view.fitExtent($scope.source.getExtent());
      } catch (variable) {
        // continue;
      }
    }

    $scope.init();
  });
