'use strict';

/**
 * @ngdoc function
 * @name frontApp.controller:ProcesarVecinosCtrl
 * @description
 * # ProcesarVecinosCtrl
 * Controller of the frontApp
 */
angular.module('frontApp').controller('ProcesarVecinosCtrl', function ($scope,features,preferences) {
  $scope.preferences = preferences;
  $scope.porcent = 0;

  $scope.source = features.get_source();
  $scope.ol_features = $scope.source.getFeatures();

  $scope.rTree = new jsts.index.strtree.STRtree();


  $scope.source_active = new ol.source.Vector();
  $scope.layer_active = new ol.layer.Vector({
    source: $scope.source_active,
    style: new ol.style.Style({
      fill: new ol.style.Fill({
        color: [255,0,0,.3]
      })
    })
  });
  $scope.$parent.map.addLayer($scope.layer_active);

  $scope.source_buffer = new ol.source.Vector();
  $scope.layer_buffer = new ol.layer.Vector({
    source: $scope.source_buffer,
    style: new ol.style.Style({
      fill: new ol.style.Fill({
        color: [0,0,0,.3]
      })
    })
  });
  $scope.$parent.map.addLayer($scope.layer_buffer);

  $scope.source_vecinos = new ol.source.Vector();
  $scope.layer_vecinos = new ol.layer.Vector({
    source: $scope.source_vecinos,
    style: new ol.style.Style({
      fill: new ol.style.Fill({
        color: [0,0,255,.1]
      })
    })
  });
  $scope.$parent.map.addLayer($scope.layer_vecinos);

  $scope.source_union = new ol.source.Vector();
  $scope.layer_union = new ol.layer.Vector({
    source: $scope.source_union,
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
          stroke: stroke,
          text: new ol.style.Text({
            font: '12px Calibri,sans-serif',
            text: Math.round(feature.get('compartido')/10)/100+'km',
            fill: textFill,
            stroke: textStroke
          })
        })];
      };
    })()
  });
  $scope.$parent.map.addLayer($scope.layer_union);

  $scope.geom_process = 0;

  $scope.calculate_extent = function(feature){

    //[minx, miny, maxx, maxy]
    var extent = ol.extent.buffer(feature.getGeometry().getExtent(),1000);

    if(preferences.visual){
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
    }

    return extent;
  }

  var ol_wkt = new ol.format.WKT(),
      reader_jsts = new jsts.io.WKTReader(),
      write_jsts = new jsts.io.WKTWriter();

  $scope.feature_a_jsts = function(feature){
    var properties = feature.getProperties();
    if(!properties.jsts){
      properties.jsts = reader_jsts.read(
        ol_wkt.writeFeature(feature)
      );
      feature.setProperties(properties);
    }
    return properties.jsts;
  }

  $scope.jsts_a_feature = function(jsts){
    return ol_wkt.readFeature(
      write_jsts.write(jsts)
    );
  }

  $scope.proceso_indices = 0;
  $scope.crear_indices = function(){
    if(preferences.visual_clear){
      $scope.source_buffer.clear();
      $scope.source_vecinos.clear();
      $scope.source_active.clear();
      $scope.source_union.clear();
    }
    var feature = $scope.ol_features[$scope.proceso_indices];
    var desde_nombre = feature.getProperties().NOMBRE;
    var id = _.uniqueId('feature_');

    if(preferences.visual){
      $scope.source_active.addFeature(feature);

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

      preferences.view.fitExtent(feature.getGeometry().getExtent(),preferences.map.getSize());
    }

    var buffer = $scope.calculate_extent(feature);

    var extent_base = _.clone(buffer);

    var jsts_main = $scope.feature_a_jsts(feature);

    var perimeter_main = jsts_main.getLength();

    var feature_main = feature;

    $scope.source.forEachFeatureInExtent(buffer,function(feature){
      if(feature.getId() === feature_main.getId())
        return;
      var jsts_local = $scope.feature_a_jsts(feature);
      var perimeter_local = jsts_local.getLength();


      var interseccion = jsts_local.intersection(jsts_main),
          perimeter_union = jsts_local.union(jsts_main).getLength();

      var interseccion_perimeter = (perimeter_local + perimeter_main) - perimeter_union;
      var hasta_nombre = feature.getProperties().NOMBRE;

      console.log('Perimetro compartido',desde_nombre,hasta_nombre,interseccion_perimeter);
      if(preferences.visual && !interseccion.isEmpty()){
        $scope.source_vecinos.addFeature(feature);
        ol.extent.extend(extent_base,feature.getGeometry().getExtent());
        var line = new jsts.geom.LineString(interseccion.getCoordinates(),interseccion.getPrecisionModel()),
            frontera = $scope.jsts_a_feature(line);
        frontera.set('compartido',interseccion_perimeter);
        $scope.source_union.addFeature(frontera);
      }
    })

    if(preferences.visual){
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

      preferences.view.fitExtent(extent_base,preferences.map.getSize());
    }

    // var jsts = $scope.feature_a_jsts(buffer);

    //Creo una entrada en mi indice por id
    // $scope.indice[id] = {
    //   ol: feature,
    //   buffer: buffer,
    //   jsts: jsts
    // };

    $scope.proceso_indices ++;

    if($scope.proceso_indices < $scope.ol_features.length){
      if(!preferences.debug)
        setTimeout(function(){
          $scope.crear_indices();
        },100);
    }

    if(!$scope.$$phase){
      $scope.$apply();
    }
  }

  $scope.init = function(){
    $scope.crear_indices();
  }

  $scope.con_buffer_real = function(feature){
    var ol_wkt = new ol.format.WKT(),
        reader = new jsts.io.WKTReader(),
        writer = new jsts.io.WKTWriter();

    var wkt = ol_wkt.writeFeature(feature),
        geom = reader.read(wkt);

    //Calculo buffer
    var buffer_geom = geom.buffer(1000);

    //Dibujo buffer
    var buffer_wkt = writer.write(buffer_geom);
    var buffer = ol_wkt.readFeature(buffer_wkt);
    $scope.source_buffer.addFeature(buffer);
  }
});
