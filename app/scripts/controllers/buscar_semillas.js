'use strict';

/**
 * @ngdoc function
 * @name frontApp.controller:BuscarSemillasCtrl
 * @description
 * # BuscarSemillasCtrl
 * Controller of the frontApp
 */
angular.module('frontApp')
  .controller('BuscarSemillasCtrl', function ($scope,preferences,features, calculos) {
    $scope.total = preferences.propiedad_suma_total;
    $scope.clusters_cantidad = preferences.cantidad_de_semillas;
    $scope.objetivo = preferences.propiedad_suma_total / preferences.cantidad_de_semillas;
    preferences.set_objetivo($scope.objetivo);
    $scope.features = features;

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

      $scope.source_clusters = new ol.source.Vector();
      $scope.layer_clusters = new ol.layer.Vector({
        source: $scope.source_clusters,
        style: (function() {
          return function(feature, resolution) {
            return [new ol.style.Style({
              fill: new ol.style.Fill({
                color: [255,0,0,.8]
              }),
              stroke: new ol.style.Stroke({
                color: [0,0,0,.8]
              })
            })];
          };
        })()
      });
      preferences.map.addLayer($scope.layer_clusters);

      $scope.source_clusters_radios = new ol.source.Vector();
      $scope.layer_clusters_radios = new ol.layer.Vector({
        source: $scope.source_clusters_radios
      })
      preferences.map.addLayer($scope.layer_clusters_radios);

      $scope.source_mc = new ol.source.Vector();
      $scope.layer_mc = new ol.layer.Vector({
        source: $scope.source_mc,
        style: (function() {
          return function(feature, resolution) {
            return [new ol.style.Style({
              stroke: new ol.style.Stroke({
                color: [0,0,255,.8]
              })
            })];
          };
        })()
      });
      preferences.map.addLayer($scope.layer_mc);

      $scope.source_pp = new ol.source.Vector();
      $scope.layer_pp = new ol.layer.Vector({
        source: $scope.source_pp,
        style: (function() {
          return function(feature, resolution) {
            return [new ol.style.Style({
              fill: new ol.style.Fill({
                color: [0,0,255,.2]
              }),
              stroke: new ol.style.Stroke({
                color: [0,0,0,.5],
                width: 2
              })
            })];
          };
        })()
      });
      preferences.map.addLayer($scope.layer_pp);

      $scope.source_mp = new ol.source.Vector();
      $scope.layer_mp = new ol.layer.Vector({
        source: $scope.source_mp,
        style: (function() {
          return function(feature, resolution) {
            return [new ol.style.Style({
              stroke: new ol.style.Stroke({
                color: [255,0,0,.8]
              })
            })];
          };
        })()
      });
      preferences.map.addLayer($scope.layer_mp);

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

      $scope.radio_preferencial = Math.sqrt(geom.getArea()/(Math.PI*$scope.clusters_cantidad));

      $scope.ol_features.forEach(function(feature){
        $scope.source.addFeature(feature);
      });


      $scope.seleccionarSemillas(1);
    }

    $scope.clusters = [];
    $scope.clusters_map = {};
    $scope.semillas_id = [];
    $scope.poligonos_asignados = [];

    $scope.limites_alpha = [];

    $scope.features_map = {};

    $scope.agregar_semilla = function(feature){
      $scope.semillas_id.push(feature.getId());
      $scope.agregar_poligono_asignado(feature);
      var cluster = calculos.crear_cluster(feature);
      $scope.clusters.push(cluster);
      $scope.clusters_map[cluster.getId()] = cluster;
    }

    $scope.agregar_poligono_asignado = function(poligono){
      if($scope.poligonos_asignados.indexOf(poligono.getId()) < 0){
        $scope.poligonos_asignados.push(poligono.getId());
      }
    }

    $scope.seleccionarSemillas = function(alpha){
      var radio_alpha = $scope.radio_preferencial * alpha;
      $scope.featuresOrdenadas = $scope.ol_features.sort(function(a, b) {
        return b.get('rating') - a.get('rating');
      });

      $scope.agregar_semilla($scope.featuresOrdenadas[0]);

      _.each($scope.featuresOrdenadas,function(feature){
        //Hago un extent con los dos centro
        var centro_feature = feature.get('centro') || false;
        if(!centro_feature){
          centro_feature = feature.getGeometry().getInteriorPoint().getCoordinates();
          feature.set('centro',centro_feature);
        }

        var mas_cercana = _.min($scope.clusters, function(semilla){
          var centro_semilla = semilla.get('centro') || false;

          if(!centro_semilla){
            centro_semilla = semilla.getGeometry().getInteriorPoint().getCoordinates();
            semilla.set('centro',centro_semilla);
          }

          var linea_centros = new ol.geom.LineString([centro_feature,centro_semilla]);
          return linea_centros.getLength();
        });

        var distancia_minima = new ol.geom.LineString([mas_cercana.get('centro'),feature.get('centro')]).getLength();

        $scope.features_map[feature.getId()] = feature;
        if(distancia_minima > radio_alpha && $scope.clusters.length < $scope.clusters_cantidad){
          $scope.agregar_semilla(feature);
        }
        return false;
      });

      $scope.clusters_activos = _.clone($scope.clusters);

      preferences.set_clusters($scope.clusters);

      $scope.clusters.forEach(function(semilla){
        $scope.source_clusters.addFeature(_.clone(semilla));
        var centro_4326 = new ol.geom.Point(semilla.get('centro')).transform('EPSG:3857','EPSG:4326').getCoordinates(),
            sphere = new ol.Sphere(6378137),
            geom = ol.geom.Polygon.circular(sphere, centro_4326, radio_alpha/2).transform('EPSG:4326', 'EPSG:3857'),
            radio = new ol.Feature({
              geometry: geom
            });

        $scope.source_clusters_radios.addFeature(radio);
      });


    }

    $scope.hacer_todo = false;
    $scope.hay_punto_muerto = false
    $scope.mejor_cluster = false;
    $scope.mc = function(){
      var clusters_local;
      if($scope.hay_punto_muerto){
        clusters_local = calculos.cluster_sin_pm($scope.clusters);
      }else{
        clusters_local = $scope.clusters;
      }
      $scope.source_mc.clear();
      $scope.mejor_cluster = calculos.mejor_cluster(clusters_local,$scope.features_map,$scope.poligonos_asignados);
      $scope.source_mc.addFeature($scope.mejor_cluster);

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

      preferences.view.fitExtent($scope.mejor_cluster.getGeometry().getExtent(),preferences.map.getSize());
      if($scope.hacer_todo){
        setTimeout($scope.pp,100);
      }
    }

    $scope.poligonos_posibles = false;
    $scope.pp = function(){
      $scope.source_pp.clear();
      $scope.poligonos_posibles = calculos.poligonos_posibles($scope.mejor_cluster,$scope.features_map,$scope.semillas_id);
      //No puede crecer mas
      if($scope.poligonos_posibles.length == 0){
        $scope.clusters_activos = $scope.clusters_activos.filter(function(cluster){
          return cluster.getId() != $scope.mejor_cluster.getId();
        });
        $scope.mejor_cluster = false;
        $scope.poligonos_posibles = false;
        $scope.hay_punto_muerto = true;
        if($scope.hacer_todo){
          $scope.mc();
          return;
        }
      }
      _.each($scope.poligonos_posibles,function(poligono_posible){
        $scope.source_pp.addFeature(poligono_posible);
      })
      if($scope.hacer_todo){
        $scope.mp();
      }
    }

    $scope.mejor_poligono = false;
    $scope.mp = function(){
      $scope.source_mp.clear();
      $scope.mejor_poligono = calculos.mejor_poligono($scope.mejor_cluster,$scope.clusters,$scope.features_map,$scope.semillas_id,$scope.poligonos_asignados,$scope.poligonos_posibles);
      $scope.source_mp.addFeature($scope.mejor_poligono);
      if($scope.hacer_todo){
        $scope.actualizar();
      }
    }

    $scope.actualizar = function(){
      $scope.hay_punto_muerto = !calculos.actualizar($scope.mejor_cluster,$scope.mejor_poligono,$scope.features_map,$scope.clusters_map);
      $scope.agregar_poligono_asignado($scope.mejor_poligono);
      $scope.mejor_cluster = false;
      $scope.source_mc.clear();
      $scope.poligonos_posibles = false;
      $scope.source_pp.clear();
      $scope.mejor_poligono = false;
      $scope.source_mp.clear();

      if($scope.hacer_todo){
        setTimeout(function(){
          $scope.mc();
        },100);
      }
    }

    $scope.completo = function(){
      $scope.hacer_todo = true;
      $scope.mc();
    }

    if(!preferences.map){
      $scope.$on('map',function(){
        $scope.addLayer();
      })
    }else{
      $scope.addLayer();
    }
  });
