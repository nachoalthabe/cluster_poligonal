'use strict';

/**
 * @ngdoc function
 * @name frontApp.controller:IndexCtrl
 * @description
 * # IndexCtrl
 * Controller of the frontApp
 */
angular.module('frontApp')
  .controller('IndexCtrl', function ($scope,$location,preferences,features) {
    $scope.preferences = preferences;
    $scope.init = function(){
      function handleFileSelect(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        var files = evt.dataTransfer.files,
            shape = null,
            dbf = null,
            geojson= null,
            size = 0;
        angular.forEach(files,function(file){
          size += file.size;
          if(file.name.indexOf('.dbf') != -1){
            dbf = file;
          }
          if(file.name.indexOf('.shp') != -1){
            shape = file;
          }
          if(file.name.indexOf('.geojson') != -1){
            geojson = file;
          }
        });
        if(geojson){
          features.parse_geojson(geojson).then(function(){
            $location.path('/shape');
          })
        }else{
          features.parse_shp(shape,dbf).then(function(){
            $location.path('/shape');
          })
        }
      }

      function handleDragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
      }

      // Setup the dnd listeners.
      var dropZone = document.getElementById('drop_zone');
      dropZone.addEventListener('dragover', handleDragOver, false);
      dropZone.addEventListener('drop', handleFileSelect, false);
      $scope.selected = preferences.selected;
    };

    $scope.$watch('selected', function(val){
      preferences.set_selected(val);
    });

    $scope.init();
  });
