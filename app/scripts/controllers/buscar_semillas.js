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
    preferences.set_objetivo($scope.objetivo);
    $scope.pasadas = preferences.pasadas;

    preferences.showMap();

    $scope.source = features.get_source();
    $scope.ol_features = $scope.source.getFeatures();

    $scope.limites = {
      min: Number.MAX_VALUE,
      max: Number.MIN_VALUE
    }

    $scope.addLayer= function(){
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
              })
            })];
          };
        })()
      });
      preferences.map.addLayer($scope.layer_semillas);

      $scope.source_libres = new ol.source.Vector();
      $scope.ol_features.forEach(function(feature){
        $scope.source_libres.addFeature(_.clone(feature));
      })
      $scope.layer_libres = new ol.layer.Vector({
        source: $scope.source_libres,
        style: (function() {
          return function(feature, resolution) {
            return [new ol.style.Style({
              stroke: new ol.style.Stroke({
                color: [0,255,0,.8]
              })
            })];
          };
        })()
      });
      preferences.map.addLayer($scope.layer_libres);

      $scope.source_semillas_radios = new ol.source.Vector();
      $scope.layer_semillas_radios = new ol.layer.Vector({
        source: $scope.source_semillas_radios
      })
      preferences.map.addLayer($scope.layer_semillas_radios);

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


      $scope.seleccionarSemillas(1);
    }

    $scope.semillas = [];

    $scope.limites_alpha = [];

    $scope.features_libres = [];

    $scope.calcular_limites_alpha = function(_min,_max){
      var min = Math.round(_min*10)/10,
          max = Math.round(_max*10)/10;
      if( ! ((min < 2 && min < max) && (max > 0 && max > min))){
        alert('Limites invalidos');
      }
      $scope.limites_alpha = [];
      while(min < max){
        $scope.limites_alpha.push(min);
        min += .1;
      }
    }

    $scope.seleccionarSemillas = function(alpha){
      var radio_alpha = $scope.radio_preferencial * alpha;
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

        if(distancia_minima > radio_alpha && $scope.semillas.length < $scope.semillas_cantidad){
          $scope.semillas.push(feature);
          $scope.source_libres.removeFeature(feature);
          $scope.desconectar_vecinos(feature);
        }
      });

      preferences.set_clusters($scope.semillas);

      $scope.semillas.forEach(function(semilla){
        $scope.source_semillas.addFeature(semilla);
        var centro_4326 = new ol.geom.Point(semilla.get('centro')).transform('EPSG:3857','EPSG:4326').getCoordinates(),
            sphere = new ol.Sphere(6378137),
            geom = ol.geom.Polygon.circular(sphere, centro_4326, radio_alpha/2).transform('EPSG:4326', 'EPSG:3857'),
            radio = new ol.Feature({
              geometry: geom
            });

        $scope.source_semillas_radios.addFeature(radio);
      });

    }

    $scope.desconectar_vecinos = function(feature){
      var vecinos = feature.get('_vecinos'),
          id = parseInt(feature.getId());

      _.each(vecinos,function(frontera_comun,vecino_id){
        var vecino = $scope.source_libres.getFeatureById(vecino_id),
            vecinos_de_vecino = vecino.get('_vecinos');
        delete vecinos_de_vecino[id];
        feature.set('_vecinos',vecinos_de_vecino);
      })
    }

    if(!preferences.map){
      $scope.$on('map',function(){
        $scope.addLayer();
      })
    }else{
      $scope.addLayer();
    }
  });
