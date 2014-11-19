"use strict";angular.module("frontApp",["ngAnimate","ngCookies","ngResource","ngRoute","ngSanitize","ngTouch","ui.bootstrap"]).config(["$routeProvider",function(a){a.when("/about",{templateUrl:"views/about.html",controller:"AboutCtrl"}).when("/",{templateUrl:"views/index.html",controller:"IndexCtrl"}).when("/calcular_vecinos",{templateUrl:"views/procesar_vecinos.html",controller:"ProcesarVecinosCtrl"}).when("/juntar",{templateUrl:"views/juntar.html",controller:"JuntarCtrl"}).when("/separar",{templateUrl:"views/separar.html",controller:"SepararCtrl"}).when("/buscar_semillas",{templateUrl:"views/buscar_semillas.html",controller:"BuscarSemillasCtrl"}).otherwise({redirectTo:"/"})}]),angular.module("frontApp").controller("MainCtrl",["$scope",function(a){a.awesomeThings=["HTML5 Boilerplate","AngularJS","Karma"]}]),angular.module("frontApp").controller("IndexCtrl",["$scope","$location","preferences","features",function(a,b,c,d){a.preferences=c,c.hideMap(),a.init=function(){function e(a){a.stopPropagation(),a.preventDefault();var c=a.dataTransfer.files,e=null,f=null,g=null,h=0;angular.forEach(c,function(a){h+=a.size,-1!=a.name.indexOf(".dbf")&&(f=a),-1!=a.name.indexOf(".shp")&&(e=a),-1!=a.name.indexOf(".geojson")&&(g=a)}),g?d.parse_geojson(g).then(function(){b.path("/calcular_vecinos")}):d.parse_shp(e,f).then(function(){b.path("/calcular_vecinos")})}function f(a){a.stopPropagation(),a.preventDefault(),a.dataTransfer.dropEffect="copy"}var g=document.getElementById("drop_zone");g.addEventListener("dragover",f,!1),g.addEventListener("drop",e,!1),a.selected=c.selected},a.$watch("selected",function(a){c.set_selected(a)}),a.init()}]),angular.module("frontApp").controller("PreviewShapeCtrl",["$scope","$location","preferences","features",function(a,b,c,d){a.preferences=c,a.init=function(){if(0==d.get_current())return void b.path("/");a.source=d.get_source(),a.layer=d.get_layer(),c.view=new ol.View({center:ol.proj.transform([0,0],"EPSG:4326","EPSG:3857"),zoom:4,projection:"EPSG:3857"}),a.map=new ol.Map({target:"map",layers:[new ol.layer.Tile({source:new ol.source.OSM}),a.layer],view:c.view}),c.setMap(a.map);try{c.view.fitExtent(a.source.getExtent())}catch(e){}},a.init()}]),angular.module("frontApp").factory("features",["$q","preferences",function(a){var b={};b.current=localStorage.getItem("current_json")||!1,b.current!==!1&&(b.current=JSON.parse(b.current));var c=new ol.format.WKT,d=new jsts.io.WKTReader,e=new jsts.io.WKTWriter;return b.feature_a_jsts=function(a){return d.read(c.writeFeature(a))},b.jsts_a_feature=function(a){return c.readFeature(e.write(a))},b.get_source=function(){return b.source||(b.source=new ol.source.GeoJSON({object:b.get_current()})),b.source},b.get_layer=function(){return b.layer||(b.layer=new ol.layer.Vector({source:b.get_source()})),b.layer},b.get_current=function(){return b.current},b.parse_geojson=function(c){var d=a.defer(),e=new FileReader;return e.onload=function(){b.set_current(JSON.parse(e.result)),d.resolve(b.get_current())},e.readAsText(c),d.promise},b.set_current=function(a){b.current=a;try{localStorage.setItem("current_json",JSON.stringify(a))}catch(c){}},b.update_current=function(){var a=new ol.format.GeoJSON,c=a.writeFeatures(b.get_source().getFeatures());b.set_current(c)},b.get_jsts=function(){if(!b.jsts){var a=new jsts.io.GeoJSONReader;b.jsts=a.read(b.get_current())}return b.jsts},b}]),angular.module("frontApp").factory("preferences",["$rootScope",function(a){var b=["EPSG:4326","EPSG:22185","EPSG:3857"],c=new ol.proj.Projection({code:"EPSG:22185",units:"+proj=tmerc +lat_0=-90 +lon_0=-60 +k=1 +x_0=5500000 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"});ol.proj.addProjection(c);var d=localStorage.getItem("preferences.selected")||!1,e={projections:b,selected:d,visual:!0,visual_clear:!0,debug:!0};return e.set_selected=function(a){e.selected=a,localStorage.setItem("preferences.selected",a)},e.setMap=function(b){e.map=b,a.$broadcast("map")},e.hideMap=function(){e.hide_map=!0},e.showMap=function(){e.hide_map=!1},e}]),angular.module("frontApp").controller("ProcesarVecinosCtrl",["$scope","features","preferences","$location",function(a,b,c,d){a.preferences=c,a.porcent=0,c.showMap(),a.calculate_extent=function(b){var d=ol.extent.buffer(b.getGeometry().getExtent(),1e3);if(c.visual){var e=new ol.geom.Polygon([[[d[0],d[1]],[d[0],d[3]],[d[2],d[3]],[d[2],d[1]]]]),f=new ol.Feature({geometry:e});a.source_buffer.addFeature(f)}return d};var e=new ol.format.WKT,f=new jsts.io.WKTReader,g=new jsts.io.WKTWriter;a.feature_a_jsts=function(a){return f.read(e.writeFeature(a))},a.jsts_a_feature=function(a){return e.readFeature(g.write(a))};var h={};a.proceso_indices=0,a.crear_indices=function(){c.visual_clear&&(a.source_buffer.clear(),a.source_active.clear(),a.source_union.clear());{var d=a.ol_features[a.proceso_indices];d.getProperties().NOMBRE,_.uniqueId("feature_")}if(c.visual){a.source_active.addFeature(d);var e=ol.animation.pan({duration:50,source:c.map.getView().getCenter()}),f=ol.animation.zoom({resolution:c.map.getView().getResolution(),duration:50});c.map.beforeRender(e),c.map.beforeRender(f),c.view.fitExtent(d.getGeometry().getExtent(),c.map.getSize())}var g=a.calculate_extent(d),i=_.clone(g),j=a.feature_a_jsts(d),k=j.getLength(),l=d;if(a.source.forEachFeatureInExtent(g,function(b){if(b.getId()!==l.getId()){var d=l.get("_vecinos")||{},e=b.get("_vecinos")||{};if("undefined"==typeof d[b.getId()]){{var f=a.feature_a_jsts(b),g=f.getLength(),m=f.intersection(j),n=f.union(j).getLength(),o=g+k-n;b.getProperties().NOMBRE}if(!m.isEmpty()){var d=l.get("_vecinos")||{},e=b.get("_vecinos")||{};d[b.getId()]=o,e[l.getId()]=o,l.set("_vecinos",d),b.set("_vecinos",e),h[b.getId()]||(h[b.getId()]={}),h[l.getId()]||(h[l.getId()]={}),c.visual&&(a.source_vecinos.addFeature(b),ol.extent.extend(i,b.getGeometry().getExtent())),h[l.getId()][b.getId()]=h[b.getId()][l.getId()]={geom:m,length:o}}}e=b.get("_vecinos")||{}}}),c.visual){var e=ol.animation.pan({duration:50,source:c.map.getView().getCenter()}),f=ol.animation.zoom({resolution:c.map.getView().getResolution(),duration:50});c.map.beforeRender(e),c.map.beforeRender(f),c.view.fitExtent(i,c.map.getSize())}a.proceso_indices++,a.proceso_indices<a.ol_features.length?c.debug||setTimeout(function(){a.crear_indices()},100):(b.update_current(),a.listo=!0),a.$$phase||a.$apply()},a.listo=!1,a.init=function(){a.crear_indices()},a.proximo=function(){c.map.removeLayer(a.layer_active),c.map.removeLayer(a.layer_buffer),c.map.removeLayer(a.layer_vecinos),c.map.removeLayer(a.layer_union);try{c.view.fitExtent(a.source.getExtent())}catch(b){}d.path("juntar")},a.init_all=function(){c.debug=!1,a.crear_indices()},a.con_buffer_real=function(b){var c=new ol.format.WKT,d=new jsts.io.WKTReader,e=new jsts.io.WKTWriter,f=c.writeFeature(b),g=d.read(f),h=g.buffer(1e3),i=e.write(h),j=c.readFeature(i);a.source_buffer.addFeature(j)},a.ready=function(){a.source=b.get_source(),a.ol_features=a.source.getFeatures(),a.source_active=new ol.source.Vector,a.layer_active=new ol.layer.Vector({source:a.source_active,style:new ol.style.Style({fill:new ol.style.Fill({color:[255,0,0,.3]})})}),c.map.addLayer(a.layer_active),a.source_buffer=new ol.source.Vector,a.layer_buffer=new ol.layer.Vector({source:a.source_buffer,style:new ol.style.Style({fill:new ol.style.Fill({color:[0,0,0,.3]})})}),c.map.addLayer(a.layer_buffer),a.source_vecinos=new ol.source.Vector,a.layer_vecinos=new ol.layer.Vector({source:a.source_vecinos,style:function(){var a=new ol.style.Stroke({color:"black"}),b=new ol.style.Stroke({color:"#fff",width:3}),c=new ol.style.Fill({color:"#000"});return function(d){return[new ol.style.Style({fill:new ol.style.Fill({color:[0,0,255,.1]}),stroke:a,text:new ol.style.Text({font:"12px Calibri,sans-serif",text:d.get("NOMBRE"),fill:c,stroke:b})})]}}()}),c.map.addLayer(a.layer_vecinos),a.source_union=new ol.source.Vector,a.layer_union=new ol.layer.Vector({source:a.source_union,style:function(){var a=(new ol.style.Stroke({color:"black"}),new ol.style.Stroke({color:"#fff",width:3})),b=new ol.style.Fill({color:"#000"});return function(c){return[new ol.style.Style({text:new ol.style.Text({font:"12px Calibri,sans-serif",text:Math.round(c.get("compartido")/10)/100+"km",fill:b,stroke:a})})]}}()}),c.map.addLayer(a.layer_union),a.geom_process=0,a.init()},c.map?a.ready():a.$on("map",a.ready)}]),angular.module("frontApp").controller("JuntarCtrl",["$scope","$location","features","preferences",function(a,b,c,d){a.preferences=d,d.showMap(),a.source=c.get_source(),a.event=new ol.interaction.Select,a.selected=!1;var e=a.event.getFeatures();e.on("add",function(b){if(b.element){var c=b.element;if(a.selected){var d=c.get("_vecinos");"undefined"==typeof d[a.selected.getId()]?a.select_first(c):a.select_second(c)}else a.select_first(c)}}),e.on("remove",function(){}),a.select_second=function(b){var d=c.feature_a_jsts(a.selected),e=c.feature_a_jsts(b),f=c.jsts_a_feature(d.union(e));f.set("NOMBRE",a.selected.get("NOMBRE")+" + "+b.get("NOMBRE")),f.setId(a.selected.getId()+"+"+b.getId()),a.source.addFeature(f);var g=a.selected.get("_vecinos"),h=b.get("_vecinos"),i={};angular.forEach(g,function(c,d){if(d!=b.getId()){"undefined"==typeof i[d]&&(i[d]=0);var e=a.source.getFeatureById(d),g=e.get("_vecinos");"undefined"==typeof g[f.getId()]&&(g[f.getId()]=0),g[f.getId()]+=g[a.selected.getId()],delete g[a.selected.getId()],e.set("_vecinos",g),i[d]+=c}}),angular.forEach(h,function(c,d){if(d!=a.selected.getId()){"undefined"==typeof i[d]&&(i[d]=0);var e=a.source.getFeatureById(d),g=e.get("_vecinos");"undefined"==typeof g[f.getId()]&&(g[f.getId()]=0),g[f.getId()]+=g[b.getId()],delete g[b.getId()],e.set("_vecinos",g),i[d]+=c}}),f.set("_vecinos",i),a.source.removeFeature(a.selected),a.source.removeFeature(b),a.select_first(f)},a.select_first=function(b){a.selected=b,a.source_vecinos.clear();var c=b.get("_vecinos"),e=b.getGeometry().getExtent();angular.forEach(c,function(b,c){var d=a.source.getFeatureById(c);a.source_vecinos.addFeatures([d]),ol.extent.extend(e,d.getGeometry().getExtent())});var f=ol.animation.pan({duration:50,source:d.map.getView().getCenter()}),g=ol.animation.zoom({resolution:d.map.getView().getResolution(),duration:50});d.map.beforeRender(f),d.map.beforeRender(g),d.view.fitExtent(e,d.map.getSize())},a.ready=function(){a.source_vecinos=new ol.source.Vector,a.layer_vecinos=new ol.layer.Vector({source:a.source_vecinos,style:function(){var a=new ol.style.Stroke({color:"black"}),b=new ol.style.Stroke({color:"#fff",width:3}),c=new ol.style.Fill({color:"#000"});return function(d){return[new ol.style.Style({fill:new ol.style.Fill({color:[0,0,255,.1]}),stroke:a,text:new ol.style.Text({font:"12px Calibri,sans-serif",text:d.get("NOMBRE"),fill:c,stroke:b})})]}}()}),d.map.addLayer(a.layer_vecinos),d.map.addInteraction(a.event)},a.proximo=function(){d.map.removeLayer(a.layer_vecinos),c.update_current(),d.map.removeInteraction(a.event),b.path("separar")},d.map?a.ready():a.$on("map",a.ready)}]),angular.module("frontApp").controller("SepararCtrl",["$scope","$location","features","preferences",function(a,b,c,d){a.preferences=d,d.showMap(),a.source=c.get_source(),a.event=new ol.interaction.Select,a.selected=!1;var e=a.event.getFeatures();e.on("add",function(b){if(b.element){var c=b.element;if(a.selected){var d=c.get("_vecinos");"undefined"==typeof d[a.selected.getId()]?a.select_first(c):a.select_second(c)}else a.select_first(c)}}),e.on("remove",function(){}),a.select_second=function(b){var c=a.selected.get("_vecinos"),d=b.get("_vecinos");delete c[b.getId()],delete d[a.selected.getId()],a.selected.set("_vecinos",c),b.set("_vecinos",d)},a.select_first=function(b){a.selected=b,a.source_vecinos.clear();var c=b.get("_vecinos"),e=b.getGeometry().getExtent();angular.forEach(c,function(b,c){var d=a.source.getFeatureById(c);a.source_vecinos.addFeatures([d]),ol.extent.extend(e,d.getGeometry().getExtent())});var f=ol.animation.pan({duration:50,source:d.map.getView().getCenter()}),g=ol.animation.zoom({resolution:d.map.getView().getResolution(),duration:50});d.map.beforeRender(f),d.map.beforeRender(g),d.view.fitExtent(e,d.map.getSize())},a.ready=function(){a.source_vecinos=new ol.source.Vector,a.layer_vecinos=new ol.layer.Vector({source:a.source_vecinos,style:function(){var a=new ol.style.Stroke({color:"black"}),b=new ol.style.Stroke({color:"#fff",width:3}),c=new ol.style.Fill({color:"#000"});return function(d){return[new ol.style.Style({fill:new ol.style.Fill({color:[0,0,255,.1]}),stroke:a,text:new ol.style.Text({font:"12px Calibri,sans-serif",text:d.get("NOMBRE"),fill:c,stroke:b})})]}}()}),d.map.addLayer(a.layer_vecinos),d.map.addInteraction(a.event)},a.proximo=function(){d.map.removeLayer(a.layer_vecinos),c.update_current(),d.map.removeInteraction(a.event),b.path("buscar_semillas")},d.map?a.ready():a.$on("map",a.ready)}]),angular.module("frontApp").controller("BuscarSemillasCtrl",["$scope",function(a){a.awesomeThings=["HTML5 Boilerplate","AngularJS","Karma"]}]);