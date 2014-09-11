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
    // Service logic
    // ...

    var projections = ['EPSG:4326','EPSG:22185','EPSG:3857'];

    var prog_22185 = new ol.proj.Projection({
      code: 'EPSG:22185',
      units: '+proj=tmerc +lat_0=-90 +lon_0=-60 +k=1 +x_0=5500000 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
    });
    ol.proj.addProjection(prog_22185);

    var selected = localStorage.getItem("preferences.selected") || false;

    // Public API here
    return {
      projections: projections,
      selected: selected,
      visual: true,
      visual_clear: true,
      debug: true,
      set_selected: function(selected){
        this.selected = selected;
        localStorage.setItem("preferences.selected",selected);
      },
      setMap: function(map){
        this.map = map;
        $rootScope.$broadcast('map');
      }
    };
  });
