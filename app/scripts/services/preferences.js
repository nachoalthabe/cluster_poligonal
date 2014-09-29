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
      debug: true
    }

    self.set_selected = function(selected){
      self.selected = selected;
      localStorage.setItem("preferences.selected",selected);
    };

    self.setMap = function(map){
      self.map = map;
      $rootScope.$broadcast('map');
    };

    self.hideMap = function(){
      self.hide_map = true;
      //$rootScope.$apply();
    };

    self.showMap = function(){
      self.hide_map = false;
      //$rootScope.$apply();
    }

    // Public API here
    return self;
  });
