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

    var para_persistir = [{
        name: 'cantidad_de_semillas',
        default: 8
      },{
        name: 'propiedad_para_calcular',
        default: 'POB_2011'
      },{
        name: 'propiedad_suma_total',
        default: 0
      },{
        name: 'propiedad_objetivo',
        default: 0
      },{
        name: 'clusters',
        default: []
      },{
        name: 'calculo_semillas',
        default: false
      },{
        name: 'delta_semillas',
        default: 1
      },{
        name: 'orden_semillas',
        default: 'max'
      }
    ]

    self.persistir = function(){
      para_persistir.forEach(function(propiedad){
        localStorage.setItem(propiedad.name,self[propiedad.name]);
      })
    }

    self.reset = function(){
      para_persistir.forEach(function(propiedad){
        localStorage.removeItem(propiedad.name);
      });
      self.init();
    }

    self.init = function(){
      para_persistir.forEach(function(propiedad){
        self[propiedad.name] = localStorage.getItem(propiedad.name) || propiedad.default;
      });
    }

    self.set_clusters = function(clusters){
      self.clusters = clusters;
      localStorage.setItem("clusters",clusters);
    }

    self.set_objetivo = function(objetivo){
      self.propiedad_objetivo = objetivo;
      localStorage.setItem("propiedad_objetivo",objetivo);
    }

    self.init();

    // Public API here
    return self;
  });
