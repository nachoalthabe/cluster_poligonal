"use strict";angular.module("frontApp",["ngAnimate","ngCookies","ngResource","ngRoute","ngSanitize","ngTouch","ui.bootstrap"]).config(["$routeProvider",function(a){a.when("/about",{templateUrl:"views/about.html",controller:"AboutCtrl"}).when("/",{templateUrl:"views/index.html",controller:"IndexCtrl"}).when("/calcular_vecinos",{templateUrl:"views/procesar_vecinos.html",controller:"ProcesarVecinosCtrl"}).when("/juntar",{templateUrl:"views/juntar.html",controller:"JuntarCtrl"}).when("/separar",{templateUrl:"views/separar.html",controller:"SepararCtrl"}).when("/buscar_semillas",{templateUrl:"views/buscar_semillas.html",controller:"BuscarSemillasCtrl"}).otherwise({redirectTo:"/"})}]),angular.module("frontApp").controller("MainCtrl",["$scope","$modal",function(a,b){a.ayuda=function(){var a=b.open({templateUrl:"views/ayuda.html",controller:"AyudaCtrl",resolve:{}});a.result.then(function(){},function(){$log.info("Modal dismissed at: "+new Date)})}}]),angular.module("frontApp").controller("IndexCtrl",["$scope","$location","preferences","features",function(a,b,c,d){a.preferences=c,c.hideMap(),a.init=function(){function e(a){a.stopPropagation(),a.preventDefault();var c=a.dataTransfer.files,e=null,f=null,g=null,h=0;angular.forEach(c,function(a){h+=a.size,-1!=a.name.indexOf(".dbf")&&(f=a),-1!=a.name.indexOf(".shp")&&(e=a),-1!=a.name.indexOf(".geojson")&&(g=a)}),g?(d.reset_current(),d.parse_geojson(g).then(function(){b.path("/calcular_vecinos")})):alert("error, no es geojson")}function f(a){a.stopPropagation(),a.preventDefault(),a.dataTransfer.dropEffect="copy"}var g=document.getElementById("drop_zone");g.addEventListener("dragover",f,!1),g.addEventListener("drop",e,!1),a.selected=c.selected},a.$watch("selected",function(a){c.set_selected(a)}),a.init()}]),angular.module("frontApp").controller("PreviewShapeCtrl",["$scope","$location","preferences","features",function(a,b,c,d){a.preferences=c,a.init=function(){if(0==d.get_current())return void b.path("/");c.map.addLayer(d.get_layer());try{c.view.fitExtent(d.get_source().getExtent())}catch(a){}},a.$on("map",function(){a.init()})}]),angular.module("frontApp").factory("features",["$q","preferences",function(a,b){var c={};c.current=localStorage.getItem("current_json")||!1,c.current!==!1&&(c.current=JSON.parse(c.current));var d=new ol.format.WKT,e=new jsts.io.WKTReader,f=new jsts.io.WKTWriter;return c.feature_a_jsts=function(a){return e.read(d.writeFeature(a))},c.jsts_a_feature=function(a){return d.readFeature(f.write(a))},c.get_source=function(){return c.source||(c.source=new ol.source.GeoJSON({object:c.get_current()})),c.source},c.get_layer=function(){return c.layer||(c.layer=new ol.layer.Vector({source:c.get_source()})),c.layer},c.get_current=function(){return c.current},c.parse_geojson=function(b){var d=a.defer(),e=new FileReader;return e.onload=function(){c.set_current(JSON.parse(e.result)),d.resolve(c.get_current())},e.readAsText(b),d.promise},c.set_current=function(a){c.current=a;try{localStorage.setItem("current_json",JSON.stringify(a))}catch(b){}},c.reset_current=function(){b.reset(),c.current=c.source=c.layer=!1;try{localStorage.removeItem("current_json")}catch(a){}},c.update_current=function(){b.persistir();var a=new ol.format.GeoJSON,d=a.writeFeatures(c.get_source().getFeatures());c.set_current(d)},c.get_jsts=function(){if(!c.jsts){var a=new jsts.io.GeoJSONReader;c.jsts=a.read(c.get_current())}return c.jsts},c}]),angular.module("frontApp").factory("preferences",["$rootScope",function(a){var b=["EPSG:4326","EPSG:22185","EPSG:3857"],c=new ol.proj.Projection({code:"EPSG:22185",units:"+proj=tmerc +lat_0=-90 +lon_0=-60 +k=1 +x_0=5500000 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"});ol.proj.addProjection(c);var d=localStorage.getItem("preferences.selected")||!1,e={projections:b,selected:d,visual:!0,visual_clear:!0,debug:!0,map:!1};e.set_selected=function(a){e.selected=a,localStorage.setItem("preferences.selected",a)},e.hideMap=function(){e.hide_map=!0},e.showMap=function(){if(!e.map){e.view=new ol.View({center:ol.proj.transform([0,0],"EPSG:4326","EPSG:3857"),zoom:4,projection:"EPSG:3857"});var b=new ol.source.OSM;b.addEventListener("change",function(){console.log("on.change",arguments)}),b.addEventListener("load",function(){console.log("once.change",arguments)}),e.map=new ol.Map({target:"map",layers:[new ol.layer.Tile({source:b})],view:e.view})}a.$broadcast("map"),e.hide_map=!1};var f=[{name:"cantidad_de_semillas","default":8},{name:"propiedad_para_calcular","default":"POB_2011"},{name:"propiedad_suma_total","default":0},{name:"propiedad_objetivo","default":0},{name:"clusters","default":[]},{name:"calculo_semillas","default":!1}];return e.persistir=function(){f.forEach(function(a){localStorage.setItem(a.name,e[a.name])})},e.reset=function(){f.forEach(function(a){localStorage.removeItem(a.name)}),e.init()},e.init=function(){f.forEach(function(a){e[a.name]=localStorage.getItem(a.name)||a.default})},e.set_clusters=function(a){e.clusters=a,localStorage.setItem("clusters",a)},e.set_objetivo=function(a){e.propiedad_objetivo=a,localStorage.setItem("propiedad_objetivo",a)},e.init(),e}]),angular.module("frontApp").controller("ProcesarVecinosCtrl",["$scope","features","preferences","$location",function(a,b,c,d){a.preferences=c,a.porcent=0,c.showMap(),a.calculate_extent=function(b){var d=ol.extent.buffer(b.getGeometry().getExtent(),1e3);if(c.visual){var e=new ol.geom.Polygon([[[d[0],d[1]],[d[0],d[3]],[d[2],d[3]],[d[2],d[1]]]]),f=new ol.Feature({geometry:e});a.source_buffer.addFeature(f)}return d};var e=new ol.format.WKT,f=new jsts.io.WKTReader,g=new jsts.io.WKTWriter;a.feature_a_jsts=function(a){return f.read(e.writeFeature(a))},a.jsts_a_feature=function(a){return e.readFeature(g.write(a))};var h={};a.proceso_indices=0,a.crear_indices=function(){c.visual_clear&&(a.source_buffer.clear(),a.source_active.clear(),a.source_union.clear());var d=a.ol_features[a.proceso_indices];c.propiedad_suma_total+=d.get(c.propiedad_para_calcular);d.getProperties().NOMBRE,_.uniqueId("feature_");if(c.visual){a.source_active.addFeature(d);var e=ol.animation.pan({duration:50,source:c.map.getView().getCenter()}),f=ol.animation.zoom({resolution:c.map.getView().getResolution(),duration:50});c.map.beforeRender(e),c.map.beforeRender(f),c.view.fitExtent(d.getGeometry().getExtent(),c.map.getSize())}var g=a.calculate_extent(d),i=_.clone(g),j=a.feature_a_jsts(d),k=j.getLength(),l=d;if(a.source.forEachFeatureInExtent(g,function(b){if(b.getId()!==l.getId()){var d=l.get("_vecinos")||{},e=b.get("_vecinos")||{};if("undefined"==typeof d[b.getId()]){{var f=a.feature_a_jsts(b),g=f.getLength(),m=f.intersection(j),n=f.union(j).getLength(),o=g+k-n;b.getProperties().NOMBRE}if(!m.isEmpty()){c.visual&&(a.source_vecinos.addFeature(b),ol.extent.extend(i,b.getGeometry().getExtent()));var d=l.get("_vecinos")||{},e=b.get("_vecinos")||{};d[b.getId()]=o,e[l.getId()]=o,l.set("_vecinos",d),b.set("_vecinos",e),h[b.getId()]||(h[b.getId()]={}),h[l.getId()]||(h[l.getId()]={}),h[l.getId()][b.getId()]=h[b.getId()][l.getId()]={geom:m,length:o}}}e=b.get("_vecinos")||{}}}),c.visual){var e=ol.animation.pan({duration:50,source:c.map.getView().getCenter()}),f=ol.animation.zoom({resolution:c.map.getView().getResolution(),duration:50});c.map.beforeRender(e),c.map.beforeRender(f),c.view.fitExtent(i,c.map.getSize())}a.proceso_indices++,a.proceso_indices<a.ol_features.length?c.debug||setTimeout(function(){a.crear_indices()},100):(b.update_current(),a.listo=!0),a.$$phase||a.$apply()},a.listo=!1,a.init=function(){c.propiedad_suma_total=0,a.crear_indices()},a.proximo=function(){c.map.removeLayer(a.layer_active),c.map.removeLayer(a.layer_buffer),c.map.removeLayer(a.layer_vecinos),c.map.removeLayer(a.layer_union);try{c.view.fitExtent(a.source.getExtent())}catch(b){}c.persistir(),d.path("juntar")},a.init_all=function(){c.debug=!1,a.crear_indices()},a.con_buffer_real=function(b){var c=new ol.format.WKT,d=new jsts.io.WKTReader,e=new jsts.io.WKTWriter,f=c.writeFeature(b),g=d.read(f),h=g.buffer(1e3),i=e.write(h),j=c.readFeature(i);a.source_buffer.addFeature(j)},a.ready=function(){a.source=b.get_source(),a.ol_features=a.source.getFeatures(),a.source_active=new ol.source.Vector,a.layer_active=new ol.layer.Vector({source:a.source_active,style:new ol.style.Style({fill:new ol.style.Fill({color:[255,0,0,.3]})})}),c.map.addLayer(a.layer_active),a.source_buffer=new ol.source.Vector,a.layer_buffer=new ol.layer.Vector({source:a.source_buffer,style:new ol.style.Style({fill:new ol.style.Fill({color:[0,0,0,.3]})})}),c.map.addLayer(a.layer_buffer),a.source_vecinos=new ol.source.Vector,a.layer_vecinos=new ol.layer.Vector({source:a.source_vecinos,style:function(){var a=new ol.style.Stroke({color:"black"}),b=new ol.style.Stroke({color:"#fff",width:3}),c=new ol.style.Fill({color:"#000"});return function(d){return[new ol.style.Style({fill:new ol.style.Fill({color:[0,0,255,.1]}),stroke:a,text:new ol.style.Text({font:"12px Calibri,sans-serif",text:d.get("NOMBRE"),fill:c,stroke:b})})]}}()}),c.map.addLayer(a.layer_vecinos),a.source_union=new ol.source.Vector,a.layer_union=new ol.layer.Vector({source:a.source_union,style:function(){var a=(new ol.style.Stroke({color:"black"}),new ol.style.Stroke({color:"#fff",width:3})),b=new ol.style.Fill({color:"#000"});return function(c){return[new ol.style.Style({text:new ol.style.Text({font:"12px Calibri,sans-serif",text:Math.round(c.get("compartido")/10)/100+"km",fill:b,stroke:a})})]}}()}),c.map.addLayer(a.layer_union),a.geom_process=0,a.init()},c.map?a.ready():a.$on("map",a.ready)}]),angular.module("frontApp").controller("JuntarCtrl",["$scope","$location","features","preferences",function(a,b,c,d){a.preferences=d,d.showMap(),a.source=c.get_source(),a.event=new ol.interaction.Select,a.selected=!1;var e=a.event.getFeatures();e.on("add",function(b){if(b.element){var c=b.element;if(a.selected){var d=c.get("_vecinos");"undefined"==typeof d[a.selected.getId()]?a.select_first(c):a.select_second(c)}else a.select_first(c)}}),e.on("remove",function(){}),a.select_second=function(b){var e=c.feature_a_jsts(a.selected),f=c.feature_a_jsts(b),g=c.jsts_a_feature(e.union(f));g.set(d.propiedad_para_calcular,a.selected.get(d.propiedad_para_calcular)+b.get(d.propiedad_para_calcular)),g.set("NOMBRE",a.selected.get("NOMBRE")+" + "+b.get("NOMBRE")),g.setId(a.selected.getId()+"+"+b.getId()),a.source.addFeature(g);var h=a.selected.get("_vecinos"),i=b.get("_vecinos"),j={};angular.forEach(h,function(c,d){if(d!=b.getId()){"undefined"==typeof j[d]&&(j[d]=0);var e=a.source.getFeatureById(d),f=e.get("_vecinos");"undefined"==typeof f[g.getId()]&&(f[g.getId()]=0),f[g.getId()]+=f[a.selected.getId()],delete f[a.selected.getId()],e.set("_vecinos",f),j[d]+=c}}),angular.forEach(i,function(c,d){if(d!=a.selected.getId()){"undefined"==typeof j[d]&&(j[d]=0);var e=a.source.getFeatureById(d),f=e.get("_vecinos");"undefined"==typeof f[g.getId()]&&(f[g.getId()]=0),f[g.getId()]+=f[b.getId()],delete f[b.getId()],e.set("_vecinos",f),j[d]+=c}}),g.set("_vecinos",j),a.source.removeFeature(a.selected),a.source.removeFeature(b),a.select_first(g)},a.select_first=function(b){a.selected=b,a.source_vecinos.clear();var c=b.get("_vecinos"),e=b.getGeometry().getExtent();angular.forEach(c,function(b,c){var d=a.source.getFeatureById(c);a.source_vecinos.addFeatures([d]),ol.extent.extend(e,d.getGeometry().getExtent())});var f=ol.animation.pan({duration:50,source:d.map.getView().getCenter()}),g=ol.animation.zoom({resolution:d.map.getView().getResolution(),duration:50});d.map.beforeRender(f),d.map.beforeRender(g),d.view.fitExtent(e,d.map.getSize())},a.ready=function(){a.source_vecinos=new ol.source.Vector,a.layer_vecinos=new ol.layer.Vector({source:a.source_vecinos,style:function(){var a=new ol.style.Stroke({color:"black"}),b=new ol.style.Stroke({color:"#fff",width:3}),c=new ol.style.Fill({color:"#000"});return function(d){return[new ol.style.Style({fill:new ol.style.Fill({color:[0,0,255,.1]}),stroke:a,text:new ol.style.Text({font:"12px Calibri,sans-serif",text:d.get("NOMBRE"),fill:c,stroke:b})})]}}()}),d.map.addLayer(a.layer_vecinos),d.map.addInteraction(a.event)},a.proximo=function(){d.map.removeLayer(a.layer_vecinos),c.update_current(),d.map.removeInteraction(a.event),b.path("separar")},d.map?a.ready():a.$on("map",a.ready)}]),angular.module("frontApp").controller("SepararCtrl",["$scope","$location","features","preferences",function(a,b,c,d){a.preferences=d,d.showMap(),a.source=c.get_source(),a.event=new ol.interaction.Select,a.selected=!1;var e=a.event.getFeatures();e.on("add",function(b){if(b.element){var c=b.element;if(a.selected){var d=c.get("_vecinos");"undefined"==typeof d[a.selected.getId()]?a.select_first(c):a.select_second(c)}else a.select_first(c)}}),e.on("remove",function(){}),a.select_second=function(b){var c=a.selected.get("_vecinos"),d=b.get("_vecinos");delete c[b.getId()],delete d[a.selected.getId()],a.selected.set("_vecinos",c),b.set("_vecinos",d)},a.select_first=function(b){a.selected=b,a.source_vecinos.clear();var c=b.get("_vecinos"),e=b.getGeometry().getExtent();angular.forEach(c,function(b,c){var d=a.source.getFeatureById(c);a.source_vecinos.addFeatures([d]),ol.extent.extend(e,d.getGeometry().getExtent())});var f=ol.animation.pan({duration:50,source:d.map.getView().getCenter()}),g=ol.animation.zoom({resolution:d.map.getView().getResolution(),duration:50});d.map.beforeRender(f),d.map.beforeRender(g),d.view.fitExtent(e,d.map.getSize())},a.ready=function(){a.source_vecinos=new ol.source.Vector,a.layer_vecinos=new ol.layer.Vector({source:a.source_vecinos,style:function(){var a=new ol.style.Stroke({color:"black"}),b=new ol.style.Stroke({color:"#fff",width:3}),c=new ol.style.Fill({color:"#000"});return function(d){return[new ol.style.Style({fill:new ol.style.Fill({color:[0,0,255,.1]}),stroke:a,text:new ol.style.Text({font:"12px Calibri,sans-serif",text:d.get("NOMBRE"),fill:c,stroke:b})})]}}()}),d.map.addLayer(a.layer_vecinos),d.map.addInteraction(a.event)},a.proximo=function(){d.map.removeLayer(a.layer_vecinos),c.update_current(),d.map.removeInteraction(a.event),b.path("buscar_semillas")},d.map?a.ready():a.$on("map",a.ready)}]),angular.module("frontApp").controller("BuscarSemillasCtrl",["$scope","preferences","features","calculos",function(a,b,c,d){a.total=b.propiedad_suma_total,a.clusters_cantidad=b.cantidad_de_semillas,a.objetivo=b.propiedad_suma_total/b.cantidad_de_semillas,b.set_objetivo(a.objetivo),a.features=c,b.showMap(),a.source=c.get_source(),a.ol_features=a.source.getFeatures(),a.limites={min:Number.MAX_VALUE,max:Number.MIN_VALUE},a.addLayer=function(){a.source_buffer=new ol.source.Vector,a.layer_buffer=new ol.layer.Vector({source:a.source_buffer,style:new ol.style.Style({fill:new ol.style.Fill({color:[0,0,0,.3]})})}),b.map.addLayer(a.layer_buffer),a.source=new ol.source.Vector,a.layer=new ol.layer.Vector({source:a.source,style:function(){return function(a){return[new ol.style.Style({fill:new ol.style.Fill({color:[0,255,0,a.get("rating_alpha")]})})]}}()}),b.map.addLayer(a.layer),a.source_clusters=new ol.source.Vector,a.layer_clusters=new ol.layer.Vector({source:a.source_clusters,style:function(){return function(){return[new ol.style.Style({fill:new ol.style.Fill({color:[255,0,0,.8]}),stroke:new ol.style.Stroke({color:[0,0,0,.8]})})]}}()}),b.map.addLayer(a.layer_clusters),a.source_clusters_radios=new ol.source.Vector,a.layer_clusters_radios=new ol.layer.Vector({source:a.source_clusters_radios}),b.map.addLayer(a.layer_clusters_radios),a.source_mc=new ol.source.Vector,a.layer_mc=new ol.layer.Vector({source:a.source_mc,style:function(){return function(){return[new ol.style.Style({stroke:new ol.style.Stroke({color:[0,0,255,.8]})})]}}()}),b.map.addLayer(a.layer_mc),a.source_pp=new ol.source.Vector,a.layer_pp=new ol.layer.Vector({source:a.source_pp,style:function(){return function(){return[new ol.style.Style({fill:new ol.style.Fill({color:[0,0,255,.8]})})]}}()}),b.map.addLayer(a.layer_pp),a.source_mp=new ol.source.Vector,a.layer_mp=new ol.layer.Vector({source:a.source_mp,style:function(){return function(){return[new ol.style.Style({stroke:new ol.style.Stroke({color:[255,0,0,.8]})})]}}()}),b.map.addLayer(a.layer_mp),a.initProcess()},a.initProcess=function(){var c=ol.extent.createEmpty();a.ol_features.forEach(function(d){ol.extent.extend(c,d.getGeometry().getExtent());var e=d.get(b.propiedad_para_calcular);e>a.limites.max&&(a.limites.max=e),e<a.limites.min&&(a.limites.min=e)}),a.ol_features.forEach(function(c){var d=c.get(b.propiedad_para_calcular),e=(d-a.limites.min)/(a.objetivo-a.limites.min);c.set("rating_alpha",e),c.set("rating",a.objetivo-d)});var d=new ol.geom.Polygon([[[c[0],c[1]],[c[0],c[3]],[c[2],c[3]],[c[2],c[1]]]]),e=new ol.Feature({geometry:d});a.source_buffer.addFeature(e),a.radio_preferencial=Math.sqrt(d.getArea()/(Math.PI*a.clusters_cantidad)),a.ol_features.forEach(function(b){a.source.addFeature(b)}),a.seleccionarSemillas(1)},a.clusters_activos=[],a.clusters=[],a.limites_alpha=[],a.features_libres={},a.calcular_limites_alpha=function(b,c){var d=Math.round(10*b)/10,e=Math.round(10*c)/10;for(2>d&&e>d&&e>0&&e>d||alert("Limites invalidos"),a.limites_alpha=[];e>d;)a.limites_alpha.push(d),d+=.1},a.seleccionarSemillas=function(c){var d=a.radio_preferencial*c;a.featuresOrdenadas=a.ol_features.sort(function(a,b){return b.get("rating")-a.get("rating")}),a.clusters.push(a.featuresOrdenadas[0]),a.desconectar_vecinos(a.featuresOrdenadas[0]),_.each(a.featuresOrdenadas,function(b){if(!_.some(a.clusters,function(a){return a.getId()==b.getId()})){var c=b.get("centro")||!1;c||(c=b.getGeometry().getInteriorPoint().getCoordinates(),b.set("centro",c));var e=_.min(a.clusters,function(a){var b=a.get("centro")||!1;b||(b=a.getGeometry().getInteriorPoint().getCoordinates(),a.set("centro",b));var d=new ol.geom.LineString([c,b]);return d.getLength()}),f=new ol.geom.LineString([e.get("centro"),b.get("centro")]).getLength();return f>d&&a.clusters.length<a.clusters_cantidad?(a.clusters.push(b),a.desconectar_vecinos(b)):a.features_libres[b.getId()]=b,!1}}),a.clusters_activos=_.clone(a.clusters),b.set_clusters(a.clusters),a.clusters.forEach(function(b){a.source_clusters.addFeature(_.clone(b));var c=new ol.geom.Point(b.get("centro")).transform("EPSG:3857","EPSG:4326").getCoordinates(),e=new ol.Sphere(6378137),f=ol.geom.Polygon.circular(e,c,d/2).transform("EPSG:4326","EPSG:3857"),g=new ol.Feature({geometry:f});a.source_clusters_radios.addFeature(g)})},a.desconectar_vecinos=function(b){var c=b.get("_vecinos"),d=parseInt(b.getId());_.each(c,function(b,c){var e=a.source.getFeatureById(c),f=e.get("_vecinos");delete f[d],e.set("_vecinos",f)})},a.hacer_todo=!1,a.mejor_cluster=!1,a.mc=function(){if(a.source_buffer.clear(),a.source_clusters_radios.clear(),0!=a.clusters_activos.length){a.hay_punto_muerto=!1,a.source_mc.clear(),a.mejor_cluster=d.mejor_cluster(a.clusters_activos,a.features_libres),a.source_mc.addFeature(a.mejor_cluster);var c=ol.animation.pan({duration:50,source:b.map.getView().getCenter()}),e=ol.animation.zoom({resolution:b.map.getView().getResolution(),duration:50});b.map.beforeRender(c),b.map.beforeRender(e),b.view.fitExtent(a.mejor_cluster.getGeometry().getExtent(),b.map.getSize()),a.hacer_todo&&setTimeout(a.pp,100)}},a.poligonos_posibles=!1,a.pp=function(){return a.source_pp.clear(),a.poligonos_posibles=d.poligonos_posibles(a.mejor_cluster,a.features_libres),0==a.poligonos_posibles.length&&(a.clusters_activos=a.clusters_activos.filter(function(b){return b.getId()!=a.mejor_cluster.getId()}),a.mejor_cluster=!1,a.poligonos_posibles=!1,a.hay_punto_muerto=!0,a.hacer_todo)?void a.mc():(_.each(a.poligonos_posibles,function(b){a.source_pp.addFeature(b)}),void(a.hacer_todo&&a.mp()))},a.mejor_poligono=!1,a.mp=function(){a.source_mp.clear(),a.mejor_poligono=d.mejor_poligono(a.mejor_cluster,a.poligonos_posibles),a.source_mp.addFeature(a.mejor_poligono),a.hacer_todo&&a.juntar()},a.juntar=function(){d.juntar(a.mejor_cluster,a.mejor_poligono,a.features_libres),a.mejor_cluster=!1,a.source_mc.clear(),a.poligonos_posibles=!1,a.source_pp.clear(),a.mejor_poligono=!1,a.source_mp.clear(),a.hacer_todo&&setTimeout(function(){a.mc()},100)},a.completo=function(){a.hacer_todo=!0,a.mc()},b.map?a.addLayer():a.$on("map",function(){a.addLayer()})}]),angular.module("frontApp").controller("AyudaCtrl",["$scope","$modalInstance",function(a,b){a.cerrar=function(){b.close()},a.contacto=function(){alert("Formulario de contacto. ToDo"),b.close()}}]),angular.module("frontApp").service("calculos",["preferences","features",function a(b,c){var a={};return a.h=function(a){var d=a.get(b.propiedad_para_calcular),e=b.propiedad_objetivo,f=c.feature_a_jsts(a),g=4*Math.PI,h=f.getLength()*f.getLength();return(e-d)/e+(g-h/f.getArea())/g},a.g=function(a,b){var c=a.get("_vecinos"),d=0,e={},f={},g=0;return _.each(c,function(a,b){d+=a,e[b]=a}),_.each(c,function(a,c){if("undefined"!=typeof b[c]){var d=b[c],g=d.get("_vecinos"),h=_.clone(e),i=0;delete h[c],_.each(g,function(a,b){h[b]?h[b]+=a:h[b]=a}),_.each(h,function(a){i+=a}),f[c]=i}}),g=_.max(f,function(a){return a}),(d-g)/d},a.f=function(b,c){return a.g(b,c)+a.h(b)},a.mejor_cluster=function(b,c){var d=b.sort(function(b,d){return a.f(d,c)-a.f(b,c)}),e=a.h(d[0]),f=d.filter(function(b){return a.f(b,c)==e});return 1==f.length?f[0]:_.min(b,function(a){return _.size(a.get("_vecinos"))})},a.poligonos_posibles=function(a,b){var c=a.get("_vecinos"),d=[];return _.each(c,function(a,c){"undefined"!=typeof b[c]&&d.push(b[c])}),d},a.mejor_poligono=function(a,b){var c=a.get("_vecinos"),d=[];_.each(b,function(a){var b=a.get("_vecinos"),e=_.clone(c),f=0;delete e[a.getId()],_.each(b,function(a,b){e[b]?e[b]+=a:e[b]=a}),_.each(e,function(a){f+=a}),d.push({poligono:a,frontera:f})});var e=_.max(d,function(a){return a.frontera});return e.poligono},a.juntar=function(a,d,e){var f=c.feature_a_jsts(a),g=c.feature_a_jsts(d),h=c.jsts_a_feature(f.union(g));a.set(b.propiedad_para_calcular,a.get(b.propiedad_para_calcular)+d.get(b.propiedad_para_calcular)),a.set("NOMBRE",a.get("NOMBRE")+" + "+d.get("NOMBRE")),a.setId(a.getId()+"+"+d.getId()),a.setGeometry(h.getGeometry());var i=a.get("_vecinos"),j=d.get("_vecinos");delete i[d.getId()],_.each(j,function(a,b){"undefined"==typeof i[b]?i[b]=a:i[b]+=a;var c=e[b].get("_vecinos");delete c[d.getId()],e[b].set("_vecinos",c)}),a.set("_vecinos",i),delete e[d.getId()]},a}]);