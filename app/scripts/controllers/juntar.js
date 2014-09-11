'use strict';

/**
 * @ngdoc function
 * @name frontApp.controller:JuntarCtrl
 * @description
 * # JuntarCtrl
 * Controller of the frontApp
 */
angular.module('frontApp')
  .controller('JuntarCtrl', function ($scope,$location,features,preferences) {

      $scope.source = features.get_source();

      $scope.event = new ol.interaction.Select();

      $scope.selected = false;

      var collection = $scope.event.getFeatures();
      collection.on('add', function(event){
        if(!event.element) return;
        var feature = event.element;
        if(!$scope.selected){
          $scope.select_first(feature);
        }else{
          var vecinos = feature.get('_vecinos');
          if(typeof vecinos[$scope.selected.getId()] == 'undefined'){
            $scope.select_first(feature);
          }else{
            $scope.select_second(feature);
          }
        }
      });
      collection.on('remove', function(){

      });

      $scope.select_second = function(feature){
        var selected = features.feature_a_jsts($scope.selected),
            other = features.feature_a_jsts(feature);

        var new_feature = features.jsts_a_feature(selected.union(other));
        new_feature.set('NOMBRE',$scope.selected.get('NOMBRE') + ' + ' + feature.get('NOMBRE'));
        new_feature.setId($scope.selected.getId() +'+'+ feature.getId());
        $scope.source.addFeature(new_feature);

        var vecinos_1 = $scope.selected.get('_vecinos'),
            vecinos_2 = feature.get('_vecinos'),
            vecinos = {};

        angular.forEach(vecinos_1,function(distancia,featureId){
          if(featureId == feature.getId()) return;
          if(typeof vecinos[featureId] == 'undefined') vecinos[featureId] = 0;
          var local = $scope.source.getFeatureById(featureId),
              vecinos_local = local.get('_vecinos');
          if(typeof vecinos_local[new_feature.getId()] == 'undefined') vecinos_local[new_feature.getId()] = 0;
          vecinos_local[new_feature.getId()] += vecinos_local[$scope.selected.getId()];
          delete vecinos_local[$scope.selected.getId()];
          local.set('_vecinos',vecinos_local);
          vecinos[featureId] += distancia;
        })
        angular.forEach(vecinos_2,function(distancia,featureId){
          if(featureId == $scope.selected.getId()) return;
          if(typeof vecinos[featureId] == 'undefined') vecinos[featureId] = 0;
          var local = $scope.source.getFeatureById(featureId),
              vecinos_local = local.get('_vecinos');
          if(typeof vecinos_local[new_feature.getId()] == 'undefined') vecinos_local[new_feature.getId()] = 0;
          vecinos_local[new_feature.getId()] += vecinos_local[feature.getId()];
          delete vecinos_local[feature.getId()];
          local.set('_vecinos',vecinos_local);
          vecinos[featureId] += distancia;
        })

        new_feature.set('_vecinos',vecinos);

        $scope.source.removeFeature($scope.selected);
        $scope.source.removeFeature(feature);

      }

      $scope.select_first = function(feature){
        $scope.selected = feature;
        $scope.source_vecinos.clear();
        var vecinos = feature.get('_vecinos');
        var extent = feature.getGeometry().getExtent();
        angular.forEach(vecinos,function(cant,id){
          var vecino = $scope.source.getFeatureById(id);
          $scope.source_vecinos.addFeatures([vecino]);
          ol.extent.extend(extent,vecino.getGeometry().getExtent());
        });
        var pan = ol.animation.pan({
          duration: 50,
          source: /** @type {ol.Coordinate} */ (preferences.map.getView().getCenter())
        });
        var zoom = ol.animation.zoom({
          resolution: preferences.map.getView().getResolution(),
          duration: 50,
        });

        preferences.map.beforeRender(pan);
        preferences.map.beforeRender(zoom);

        preferences.view.fitExtent(extent,preferences.map.getSize());
      }

      $scope.ready = function(){
        $scope.source_vecinos = new ol.source.Vector();
        $scope.layer_vecinos = new ol.layer.Vector({
          source: $scope.source_vecinos,
          style: (function() {
            var stroke = new ol.style.Stroke({
              color: 'black'
            });
            var textStroke = new ol.style.Stroke({
              color: '#fff',
              width: 3
            });
            var textFill = new ol.style.Fill({
              color: '#000'
            });
            return function(feature, resolution) {
              return [new ol.style.Style({
                fill: new ol.style.Fill({
                  color: [0,0,255,.1]
                }),
                stroke: stroke,
                text: new ol.style.Text({
                  font: '12px Calibri,sans-serif',
                  text: feature.get('NOMBRE'),
                  fill: textFill,
                  stroke: textStroke
                })
              })];
            };
          })()
        });
        preferences.map.addLayer($scope.layer_vecinos);
        preferences.map.addInteraction($scope.event);
      }

      $scope.proximo = function(){
        preferences.map.removeLayer($scope.layer_vecinos);
        features.update_current();
        preferences.map.removeInteraction($scope.event);
        $location.path('separar');
      }

      if(!preferences.map){
        $scope.$on('map',$scope.ready);
      }else{
        $scope.ready();
      }
  });
