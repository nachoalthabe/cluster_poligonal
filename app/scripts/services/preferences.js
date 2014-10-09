'use strict';

/**
 * @ngdoc service
 * @name frontApp.preferences
 * @description
 * # preferences
 * Factory in the frontApp.
 */
angular.module('frontApp')
  .factory('preferences', function ($rootScope) {

    var projections = ['EPSG:4326','EPSG:22185','EPSG:3857'];

    var prog_22185 = new ol.proj.Projection({
      code: 'EPSG:22185',
      units: '+proj=tmerc +lat_0=-90 +lon_0=-60 +k=1 +x_0=5500000 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
    });
    ol.proj.addProjection(prog_22185);

    var selected = localStorage.getItem("preferences.selected") || false;

    var self = {
      projections: projections,
      selected: selected,
      visual: true,
      visual_clear: true,
      debug: true,
      map: false
    }

    self.set_selected = function(selected){
      self.selected = selected;
      localStorage.setItem("preferences.selected",selected);
    };

    self.hideMap = function(){
      self.hide_map = true;
      //$rootScope.$apply();
    };

    self.showMap = function(){
      if(!self.map){
        self.view = new ol.View({
          center: ol.proj.transform([0,0], 'EPSG:4326', 'EPSG:3857'),
          zoom: 4,
          projection: 'EPSG:3857'
        });

        var layer_base = new ol.source.OSM();
        layer_base.addEventListener('change',function(){
          console.log('on.change',arguments)
        });

        layer_base.addEventListener('load',function(){
          console.log('once.change',arguments)
        });

        self.map = new ol.Map({
          target: 'map',
          layers: [
            new ol.layer.Tile({
              source: layer_base
            })
          ],
          view: self.view
        });
      }

      $rootScope.$broadcast('map');
      self.hide_map = false;
      //$rootScope.$apply();
    };

    self.persistir = function(){
      localStorage.setItem("cantidad_de_semillas",self.cantidad_de_semillas);
      localStorage.setItem("propiedad_para_calcular",self.propiedad_para_calcular);
      localStorage.setItem("propiedad_suma_total",self.propiedad_suma_total);
      localStorage.setItem("pasadas",self.pasadas);
    }

    self.reset = function(){
      localStorage.removeItem("cantidad_de_semillas");
      localStorage.removeItem("propiedad_para_calcular");
      localStorage.removeItem("propiedad_suma_total");
      localStorage.removeItem("pasadas");
      self.init();
    }

    self.init = function(){
      self.cantidad_de_semillas = localStorage.getItem("cantidad_de_semillas") || 8;
      self.propiedad_para_calcular = localStorage.getItem("propiedad_para_calcular") || "POB_2011";
      self.propiedad_suma_total = localStorage.getItem("propiedad_suma_total") || 0;
      self.pasadas = localStorage.getItem("pasadas") || 10;
    }

    self.init();

    // Public API here
    return self;
  });
