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


      var current_pasada = 9;
      while(current_pasada < $scope.pasadas){
        var alpha = 1;
        setTimeout(function(){
          $scope.seleccionarSemillas(alpha);
        },0);
        current_pasada ++;
      }
    }

    $scope.semillas = [];

    $scope.limites_alpha = [];

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
        return b.get('rating') - a.get('rating');
      });

      $scope.semillas.push($scope.featuresOrdenadas.pop());


      _.reject($scope.featuresOrdenadas,function(feature){
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
          var vecinos = feature.get('_vecinos');
          vecinos.forEach(function(vecino){
            var vecinos_local = vecino.get('_vecinos');
            delete vecinos_local[feature.get('ID')];
            vecino.set('_vecinos',vecinos_local);
          })
          $scope.semillas.push(feature);
          return true;
        }
        return false;
      });

      $scope.semillas.forEach(function(semilla){
        $scope.source_semillas.addFeature(semilla);
        var centro_4326 = new ol.geom.Point(semilla.get('centro')).transform('EPSG:3857','EPSG:4326').getCoordinates(),
            sphere = new ol.Sphere(6378137),
            geom = ol.geom.Polygon.circular(sphere, centro_4326, radio_alpha/2).transform('EPSG:4326', 'EPSG:3857'),
            radio = new ol.Feature({
              geometry: geom
            });
        console.log(sphere,geom);

        $scope.source_semillas_radios.addFeature(radio);
      });

      while($scope.featuresOrdenadas.length > 0){
        $scope.crecer();
      }
    }

    $scope.crecer = function(){

    };

    $scope.elegir_semilla= function(){
      var maximo = _.max($scope.semillas,function(semilla) {
                    return semilla.get('rating');
                  }),
          maximas = _.reject($scope.semillas,function(semilla){
                    return semilla.get('rating') < maximo.get('rating');
                  }),
          menor = maximas.pop(),
          vecinos_menor = _.size(menor.get('_vecinos'));

      maximas.forEach(function(maxima){
        var vecinos_local = _.size(maxima.get('_vecinos'))
        if(vecinos_local < vecinos_menor){
          menor = maxima;
          vecinos_menor = vecinos_local;
        }
      });

      return menor;
    }

    $scope.elegir_poligono= function(cluster){
      var vecinos = cluster.get('_vecinos'),
          mp = _.min(vecinos, function(vecino){
                return vecino.get('rating');
               });
      return mp;
    }


    if(!preferences.map){
      $scope.$on('map',function(){
        $scope.addLayer();
      })
    }else{
      $scope.addLayer();
    }
  });
