'use strict';

/**
 * @ngdoc service
 * @name frontApp.shp2json
 * @description
 * # shp2json
 * Factory in the frontApp.
 */
angular.module('frontApp')
  .factory('features', function ($q,preferences) {
    var self = {};

    self.current = localStorage.getItem("current_json") || false;
    if(self.current !== false){
      self.current = JSON.parse(self.current);
    }

    self.get_source = function(){
      //si aun no existe el source
      if(!self.source){
        //lo creo
        self.source = new ol.source.GeoJSON({
          object: self.get_current()
        });
      }
      return self.source;
    }

    self.get_layer = function(){
      //Si no hay layer
      if(!self.layer){
        //OL lee el geojson
        self.layer = new ol.layer.Vector({
          source: self.get_source(),
          //style: styleFunction
        });;
      }
      return self.layer;
    }

    self.get_current = function(){
      return self.current;
    }

    self.parse_geojson = function(geojson){
      var deferred = $q.defer(),
          reader = new FileReader();

      reader.onload = function(e) {
        self.set_current(JSON.parse(reader.result));
        deferred.resolve(self.get_current());
      }
      reader.readAsText(geojson);

      return deferred.promise;
    };

    self.set_current = function(geojson){
      self.current = geojson;
      try {
        localStorage.setItem("current_json", JSON.stringify(geojson));
      } catch (variable) {

      }
    };

    self.get_jsts = function(){
      if(!self.jsts){
        var jstsReader = new jsts.io.GeoJSONReader();
        self.jsts = jstsReader.read(self.get_current());
      }
      return self.jsts;
    }

    return self;
  });
