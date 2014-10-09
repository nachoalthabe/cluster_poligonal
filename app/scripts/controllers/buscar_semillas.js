'use strict';

/**
 * @ngdoc function
 * @name frontApp.controller:BuscarSemillasCtrl
 * @description
 * # BuscarSemillasCtrl
 * Controller of the frontApp
 */
angular.module('frontApp')
  .controller('BuscarSemillasCtrl', function ($scope,preferences,features) {
    $scope.total = preferences.propiedad_suma_total;
    $scope.semillas_cantidad = preferences.cantidad_de_semillas;
    $scope.objetivo = preferences.propiedad_suma_total / preferences.cantidad_de_semillas;

    preferences.showMap();

    $scope.source = features.get_source();
    $scope.ol_features = $scope.source.getFeatures();

    $scope.limites = {
      min: Number.MAX_VALUE,
      max: Number.MIN_VALUE
    }

    $scope.addLayer= function(){
      $scope.source = new ol.source.Vector();
      $scope.layer = new ol.layer.Vector({
        source: $scope.source,
        style: (function() {
          return function(feature, resolution) {
            return [new ol.style.Style({
              fill: new ol.style.Fill({
                color: [0,255,0,feature.get('rating_alpha')]
              })
            })];
          };
        })()
      });
      preferences.map.addLayer($scope.layer);

      $scope.source_semillas = new ol.source.Vector();
      $scope.layer_semillas = new ol.layer.Vector({
        source: $scope.source_semillas,
        style: (function() {
          return function(feature, resolution) {
            return [new ol.style.Style({
              fill: new ol.style.Fill({
                color: [255,0,0,.8]
              }),
              stroke: new ol.style.Stroke({
                color: 'black'
              })
            })];
          };
        })()
      });
      preferences.map.addLayer($scope.layer_semillas);

      $scope.source_buffer = new ol.source.Vector();
      $scope.layer_buffer = new ol.layer.Vector({
        source: $scope.source_buffer,
        style: new ol.style.Style({
          fill: new ol.style.Fill({
            color: [0,0,0,.3]
          })
        })
      });
      preferences.map.addLayer($scope.layer_buffer);

      $scope.initProcess();
    };

    $scope.initProcess= function(){
      var extent = ol.extent.createEmpty();

      $scope.ol_features.forEach(function(feature){
        ol.extent.extend(extent,feature.getGeometry().getExtent());
        var poblacion = feature.get(preferences.propiedad_para_calcular);
        if (poblacion > $scope.limites.max){
          $scope.limites.max = poblacion;
        }
        if (poblacion < $scope.limites.min){
          $scope.limites.min = poblacion;
        }
      });

      $scope.ol_features.forEach(function(feature){
        var poblacion = feature.get(preferences.propiedad_para_calcular),
            valor = (poblacion - $scope.limites.min) / ($scope.objetivo - $scope.limites.min);
        feature.set('rating_alpha',valor);
        feature.set('rating',$scope.objetivo - poblacion);
      });

      var geom = new ol.geom.Polygon([[
        [extent[0],extent[1]],
        [extent[0],extent[3]],
        [extent[2],extent[3]],
        [extent[2],extent[1]]
      ]]);

      var extent_geometry = new ol.Feature({
        geometry: geom
      });

      $scope.source_buffer.addFeature(extent_geometry);

      $scope.radio_preferencial = Math.sqrt(geom.getArea()/(Math.PI*$scope.semillas_cantidad));

      $scope.ol_features.forEach(function(feature){
        $scope.source.addFeature(feature);
      });

      $scope.seleccionarSemillas();
    }

    $scope.semillas = [];

    $scope.seleccionarSemillas = function(){
      $scope.featuresOrdenadas = $scope.ol_features.sort(function(a, b) {
        return a.get('rating') - b.get('rating');
      });

      $scope.semillas.push($scope.featuresOrdenadas.pop());


      $scope.featuresOrdenadas.forEach(function(feature){
        //Hago un extent con los dos centro
        var centro_feature = feature.get('centro') || false;
        if(!centro_feature){
          centro_feature = feature.getGeometry().getInteriorPoint().getCoordinates();
          feature.set('centro',centro_feature);
        }

        var mas_cercana = _.min($scope.semillas, function(semilla){
          var centro_semilla = semilla.get('centro') || false;

          if(!centro_semilla){
            centro_semilla = semilla.getGeometry().getInteriorPoint().getCoordinates();
            semilla.set('centro',centro_semilla);
          }

          var linea_centros = new ol.geom.LineString([centro_feature,centro_semilla]);
          return linea_centros.getLength();
        });

        var distancia_minima = new ol.geom.LineString([mas_cercana.get('centro'),feature.get('centro')]).getLength();

        if(distancia_minima > $scope.radio_preferencial && $scope.semillas.length < $scope.semillas_cantidad){
          console.log('Semilla',distancia_minima,$scope.radio_preferencial);
          $scope.semillas.push(feature);
        }
      });

      $scope.semillas.forEach(function(semilla){
        //$scope.source_semillas.addFeature(semilla);
        var geom = ol.geom.Polygon.circular(new ol.Sphere($scope.radio_preferencial), semilla.get('centro'), $scope.radio_preferencial);
        console.log(geom);
        var radio = new ol.Feature({
          geometry: geom
        });
        $scope.source_semillas.addFeature(radio);
      })

      console.log('mejores',$scope.semillas);
    }


    if(!preferences.map){
      $scope.$on('map',function(){
        $scope.addLayer();
      })
    }else{
      $scope.addLayer();
    }
  });
