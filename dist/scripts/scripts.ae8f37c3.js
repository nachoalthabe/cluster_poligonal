"use strict";angular.module("frontApp",["ngAnimate","ngCookies","ngResource","ngRoute","ngSanitize","ngTouch","ui.bootstrap"]).config(["$routeProvider",function(a){a.when("/about",{templateUrl:"views/about.html",controller:"AboutCtrl"}).when("/",{templateUrl:"views/index.html",controller:"IndexCtrl"}).when("/calcular_vecinos",{templateUrl:"views/procesar_vecinos.html",controller:"ProcesarVecinosCtrl"}).when("/juntar",{templateUrl:"views/juntar.html",controller:"JuntarCtrl"}).when("/separar",{templateUrl:"views/separar.html",controller:"SepararCtrl"}).when("/buscar_semillas",{templateUrl:"views/buscar_semillas.html",controller:"BuscarSemillasCtrl"}).when("/form/config_busqueda",{templateUrl:"views/form/config_busqueda.html",controller:"FormConfigBusquedaCtrl"}).otherwise({redirectTo:"/"})}]),angular.module("frontApp").controller("MainCtrl",["$scope","$modal",function(a,b){a.ayuda=function(){var a=b.open({templateUrl:"views/ayuda.html",controller:"AyudaCtrl",resolve:{}});a.result.then(function(){},function(){$log.info("Modal dismissed at: "+new Date)})}}]),angular.module("frontApp").controller("IndexCtrl",["$scope","$location","preferences","features",function(a,b,c,d){a.preferences=c,c.hideMap(),a.init=function(){function e(a){a.stopPropagation(),a.preventDefault();var c=a.dataTransfer.files,e=null,f=null,g=null,h=0;angular.forEach(c,function(a){h+=a.size,-1!=a.name.indexOf(".dbf")&&(f=a),-1!=a.name.indexOf(".shp")&&(e=a),-1!=a.name.indexOf(".geojson")&&(g=a)}),g?(d.reset_current(),d.parse_geojson(g).then(function(){b.path("/calcular_vecinos")})):alert("error, no es geojson")}function f(a){a.stopPropagation(),a.preventDefault(),a.dataTransfer.dropEffect="copy"}var g=document.getElementById("drop_zone");g.addEventListener("dragover",f,!1),g.addEventListener("drop",e,!1),a.selected=c.selected},a.$watch("selected",function(a){c.set_selected(a)}),a.init()}]),angular.module("frontApp").controller("PreviewShapeCtrl",["$scope","$location","preferences","features",function(a,b,c,d){a.preferences=c,a.init=function(){if(0==d.get_current())return void b.path("/");c.map.addLayer(d.get_layer());try{c.view.fitExtent(d.get_source().getExtent())}catch(a){}},a.$on("map",function(){a.init()})}]),angular.module("frontApp").factory("features",["$q","preferences",function(a,b){var c={};c.current=localStorage.getItem("current_json")||!1,c.current!==!1&&(c.current=JSON.parse(c.current));var d=new ol.format.WKT,e=new jsts.io.WKTReader,f=new jsts.io.WKTWriter;return c.feature_a_jsts=function(a){return e.read(d.writeFeature(a))},c.jsts_a_feature=function(a){return d.readFeature(f.write(a))},c.get_source=function(){return c.source||(c.source=new ol.source.GeoJSON({object:c.get_current()})),c.source},c.get_layer=function(){return c.layer||(c.layer=new ol.layer.Vector({source:c.get_source()})),c.layer},c.get_current=function(){return c.current},c.parse_geojson=function(b){var d=a.defer(),e=new FileReader;return e.onload=function(){c.set_current(JSON.parse(e.result)),d.resolve(c.get_current())},e.readAsText(b),d.promise},c.set_current=function(a){c.current=a;try{localStorage.setItem("current_json",JSON.stringify(a))}catch(b){}},c.reset_current=function(){b.reset(),c.current=c.source=c.layer=!1;try{localStorage.removeItem("current_json")}catch(a){}},c.update_current=function(){b.persistir();var a=new ol.format.GeoJSON,d=a.writeFeatures(c.get_source().getFeatures());c.set_current(d)},c.get_jsts=function(){if(!c.jsts){var a=new jsts.io.GeoJSONReader;c.jsts=a.read(c.get_current())}return c.jsts},c}]),angular.module("frontApp").factory("preferences",["$rootScope",function(a){var b=["EPSG:4326","EPSG:22185","EPSG:3857"],c=new ol.proj.Projection({code:"EPSG:22185",units:"+proj=tmerc +lat_0=-90 +lon_0=-60 +k=1 +x_0=5500000 +y_0=0 +ellps=WGS84 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"});ol.proj.addProjection(c);var d=localStorage.getItem("preferences.selected")||!1,e={projections:b,selected:d,visual:!0,visual_clear:!0,debug:!0,map:!1};e.set_selected=function(a){e.selected=a,localStorage.setItem("preferences.selected",a)},e.hideMap=function(){e.hide_map=!0},e.showMap=function(){if(!e.map){e.view=new ol.View({center:ol.proj.transform([0,0],"EPSG:4326","EPSG:3857"),zoom:4,projection:"EPSG:3857"});var b=new ol.source.OSM;b.addEventListener("change",function(){console.log("on.change",arguments)}),b.addEventListener("load",function(){console.log("once.change",arguments)}),e.map=new ol.Map({target:"map",layers:[new ol.layer.Tile({source:b})],view:e.view})}a.$broadcast("map"),e.hide_map=!1};var f=[{name:"cantidad_de_semillas",type:"number","default":8},{name:"propiedad_para_calcular",type:"string","default":"POB_2011"},{name:"propiedad_suma_total",type:"number","default":0},{name:"propiedad_objetivo",type:"number","default":0},{name:"clusters",type:"array","default":[]},{name:"calculo_semillas",type:"boolean","default":!1},{name:"delta_semillas",type:"number","default":1},{name:"orden_semillas",type:"string","default":"max"},{name:"importancia_compacidad",type:"number","default":1},{name:"importancia_poblacion",type:"number","default":1}];return e.persistir=function(){f.forEach(function(a){localStorage.setItem(a.name,e[a.name])})},e.reset=function(){f.forEach(function(a){localStorage.removeItem(a.name)}),e.init()},e.init=function(){f.forEach(function(a){e[a.name]=localStorage.getItem(a.name)||a.default,"number"===a.type&&(e[a.name]=parseInt(e[a.name]))})},e.set_clusters=function(a){e.clusters=a,localStorage.setItem("clusters",a)},e.set_objetivo=function(a){e.propiedad_objetivo=a,localStorage.setItem("propiedad_objetivo",a)},e.init(),e}]),angular.module("frontApp").controller("ProcesarVecinosCtrl",["$scope","features","preferences","$location",function(a,b,c,d){a.preferences=c,a.porcent=0,c.showMap(),a.calculate_extent=function(b){var d=ol.extent.buffer(b.getGeometry().getExtent(),1e3);if(c.visual){var e=new ol.geom.Polygon([[[d[0],d[1]],[d[0],d[3]],[d[2],d[3]],[d[2],d[1]]]]),f=new ol.Feature({geometry:e});a.source_buffer.addFeature(f)}return d};var e=new ol.format.WKT,f=new jsts.io.WKTReader,g=new jsts.io.WKTWriter;a.feature_a_jsts=function(a){return f.read(e.writeFeature(a))},a.jsts_a_feature=function(a){return e.readFeature(g.write(a))};var h={};a.proceso_indices=0,a.crear_indices=function(){c.visual_clear&&(a.source_buffer.clear(),a.source_active.clear(),a.source_union.clear());var d=a.ol_features[a.proceso_indices];c.propiedad_suma_total+=d.get(c.propiedad_para_calcular);d.getProperties().NOMBRE,_.uniqueId("feature_");if(c.visual){a.source_active.addFeature(d);var e=ol.animation.pan({duration:50,source:c.map.getView().getCenter()}),f=ol.animation.zoom({resolution:c.map.getView().getResolution(),duration:50});c.map.beforeRender(e),c.map.beforeRender(f),c.view.fitExtent(d.getGeometry().getExtent(),c.map.getSize())}var g=a.calculate_extent(d),i=_.clone(g),j=a.feature_a_jsts(d),k=j.getLength(),l=d;if(a.source.forEachFeatureInExtent(g,function(b){if(b.getId()!==l.getId()){var d=l.get("_vecinos")||{},e=b.get("_vecinos")||{};if("undefined"==typeof d[b.getId()]){{var f=a.feature_a_jsts(b),g=f.getLength(),m=f.intersection(j),n=f.union(j).getLength(),o=g+k-n;b.getProperties().NOMBRE}if(!m.isEmpty()){c.visual&&(a.source_vecinos.addFeature(b),ol.extent.extend(i,b.getGeometry().getExtent()));var d=l.get("_vecinos")||{},e=b.get("_vecinos")||{};d[b.getId()]=o,e[l.getId()]=o,l.set("_vecinos",d),b.set("_vecinos",e),h[b.getId()]||(h[b.getId()]={}),h[l.getId()]||(h[l.getId()]={}),h[l.getId()][b.getId()]=h[b.getId()][l.getId()]={geom:m,length:o}}}e=b.get("_vecinos")||{}}}),c.visual){var e=ol.animation.pan({duration:50,source:c.map.getView().getCenter()}),f=ol.animation.zoom({resolution:c.map.getView().getResolution(),duration:50});c.map.beforeRender(e),c.map.beforeRender(f),c.view.fitExtent(i,c.map.getSize())}a.proceso_indices++,a.proceso_indices<a.ol_features.length?c.debug||setTimeout(function(){a.crear_indices()},100):(b.update_current(),a.listo=!0),a.$$phase||a.$apply()},a.listo=!1,a.init=function(){c.propiedad_suma_total=0,a.crear_indices()},a.proximo=function(){c.map.removeLayer(a.layer_active),c.map.removeLayer(a.layer_buffer),c.map.removeLayer(a.layer_vecinos),c.map.removeLayer(a.layer_union);try{c.view.fitExtent(a.source.getExtent())}catch(b){}c.persistir(),d.path("juntar")},a.init_all=function(){c.debug=!1,a.crear_indices()},a.con_buffer_real=function(b){var c=new ol.format.WKT,d=new jsts.io.WKTReader,e=new jsts.io.WKTWriter,f=c.writeFeature(b),g=d.read(f),h=g.buffer(1e3),i=e.write(h),j=c.readFeature(i);a.source_buffer.addFeature(j)},a.ready=function(){a.source=b.get_source(),a.ol_features=a.source.getFeatures(),a.source_active=new ol.source.Vector,a.layer_active=new ol.layer.Vector({source:a.source_active,style:new ol.style.Style({fill:new ol.style.Fill({color:[255,0,0,.3]})})}),c.map.addLayer(a.layer_active),a.source_buffer=new ol.source.Vector,a.layer_buffer=new ol.layer.Vector({source:a.source_buffer,style:new ol.style.Style({fill:new ol.style.Fill({color:[0,0,0,.3]})})}),c.map.addLayer(a.layer_buffer),a.source_vecinos=new ol.source.Vector,a.layer_vecinos=new ol.layer.Vector({source:a.source_vecinos,style:function(){var a=new ol.style.Stroke({color:"black"}),b=new ol.style.Stroke({color:"#fff",width:3}),c=new ol.style.Fill({color:"#000"});return function(d){return[new ol.style.Style({fill:new ol.style.Fill({color:[0,0,255,.1]}),stroke:a,text:new ol.style.Text({font:"12px Calibri,sans-serif",text:d.get("NOMBRE"),fill:c,stroke:b})})]}}()}),c.map.addLayer(a.layer_vecinos),a.source_union=new ol.source.Vector,a.layer_union=new ol.layer.Vector({source:a.source_union,style:function(){var a=(new ol.style.Stroke({color:"black"}),new ol.style.Stroke({color:"#fff",width:3})),b=new ol.style.Fill({color:"#000"});return function(c){return[new ol.style.Style({text:new ol.style.Text({font:"12px Calibri,sans-serif",text:Math.round(c.get("compartido")/10)/100+"km",fill:b,stroke:a})})]}}()}),c.map.addLayer(a.layer_union),a.geom_process=0,a.init()},c.map?a.ready():a.$on("map",a.ready)}]),angular.module("frontApp").controller("JuntarCtrl",["$scope","$location","features","preferences",function(a,b,c,d){a.preferences=d,d.showMap(),a.source=c.get_source(),a.event=new ol.interaction.Select,a.selected=!1;var e=a.event.getFeatures();e.on("add",function(b){if(b.element){var c=b.element;if(a.selected){var d=c.get("_vecinos");"undefined"==typeof d[a.selected.getId()]?a.select_first(c):a.select_second(c)}else a.select_first(c)}}),e.on("remove",function(){}),a.select_second=function(b){var e=c.feature_a_jsts(a.selected),f=c.feature_a_jsts(b),g=c.jsts_a_feature(e.union(f));g.set(d.propiedad_para_calcular,a.selected.get(d.propiedad_para_calcular)+b.get(d.propiedad_para_calcular)),g.set("NOMBRE",a.selected.get("NOMBRE")+" + "+b.get("NOMBRE")),g.setId(a.selected.getId()+"+"+b.getId()),a.source.addFeature(g);var h=a.selected.get("_vecinos"),i=b.get("_vecinos"),j={};angular.forEach(h,function(c,d){if(d!=b.getId()){"undefined"==typeof j[d]&&(j[d]=0);var e=a.source.getFeatureById(d),f=e.get("_vecinos");"undefined"==typeof f[g.getId()]&&(f[g.getId()]=0),f[g.getId()]+=f[a.selected.getId()],delete f[a.selected.getId()],e.set("_vecinos",f),j[d]+=c}}),angular.forEach(i,function(c,d){if(d!=a.selected.getId()){"undefined"==typeof j[d]&&(j[d]=0);var e=a.source.getFeatureById(d),f=e.get("_vecinos");"undefined"==typeof f[g.getId()]&&(f[g.getId()]=0),f[g.getId()]+=f[b.getId()],delete f[b.getId()],e.set("_vecinos",f),j[d]+=c}}),g.set("_vecinos",j),a.source.removeFeature(a.selected),a.source.removeFeature(b),a.select_first(g)},a.select_first=function(b){a.selected=b,a.source_vecinos.clear();var c=b.get("_vecinos"),e=b.getGeometry().getExtent();angular.forEach(c,function(b,c){var d=a.source.getFeatureById(c);a.source_vecinos.addFeatures([d]),ol.extent.extend(e,d.getGeometry().getExtent())});var f=ol.animation.pan({duration:50,source:d.map.getView().getCenter()}),g=ol.animation.zoom({resolution:d.map.getView().getResolution(),duration:50});d.map.beforeRender(f),d.map.beforeRender(g),d.view.fitExtent(e,d.map.getSize())},a.ready=function(){a.source_vecinos=new ol.source.Vector,a.layer_vecinos=new ol.layer.Vector({source:a.source_vecinos,style:function(){var a=new ol.style.Stroke({color:"black"}),b=new ol.style.Stroke({color:"#fff",width:3}),c=new ol.style.Fill({color:"#000"});return function(d){return[new ol.style.Style({fill:new ol.style.Fill({color:[0,0,255,.1]}),stroke:a,text:new ol.style.Text({font:"12px Calibri,sans-serif",text:d.get("NOMBRE"),fill:c,stroke:b})})]}}()}),d.map.addLayer(a.layer_vecinos),d.map.addInteraction(a.event)},a.proximo=function(){d.map.removeLayer(a.layer_vecinos),c.update_current(),d.map.removeInteraction(a.event),b.path("separar")},d.map?a.ready():a.$on("map",a.ready)}]),angular.module("frontApp").controller("SepararCtrl",["$scope","$location","features","preferences",function(a,b,c,d){a.preferences=d,d.showMap(),a.source=c.get_source(),a.event=new ol.interaction.Select,a.selected=!1;var e=a.event.getFeatures();e.on("add",function(b){if(b.element){var c=b.element;if(a.selected){var d=c.get("_vecinos");"undefined"==typeof d[a.selected.getId()]?a.select_first(c):a.select_second(c)}else a.select_first(c)}}),e.on("remove",function(){}),a.select_second=function(b){var c=a.selected.get("_vecinos"),d=b.get("_vecinos");delete c[b.getId()],delete d[a.selected.getId()],a.selected.set("_vecinos",c),b.set("_vecinos",d)},a.select_first=function(b){a.selected=b,a.source_vecinos.clear();var c=b.get("_vecinos"),e=b.getGeometry().getExtent();angular.forEach(c,function(b,c){var d=a.source.getFeatureById(c);a.source_vecinos.addFeatures([d]),ol.extent.extend(e,d.getGeometry().getExtent())});var f=ol.animation.pan({duration:50,source:d.map.getView().getCenter()}),g=ol.animation.zoom({resolution:d.map.getView().getResolution(),duration:50});d.map.beforeRender(f),d.map.beforeRender(g),d.view.fitExtent(e,d.map.getSize())},a.ready=function(){a.source_vecinos=new ol.source.Vector,a.layer_vecinos=new ol.layer.Vector({source:a.source_vecinos,style:function(){var a=new ol.style.Stroke({color:"black"}),b=new ol.style.Stroke({color:"#fff",width:3}),c=new ol.style.Fill({color:"#000"});return function(d){return[new ol.style.Style({fill:new ol.style.Fill({color:[0,0,255,.1]}),stroke:a,text:new ol.style.Text({font:"12px Calibri,sans-serif",text:d.get("NOMBRE"),fill:c,stroke:b})})]}}()}),d.map.addLayer(a.layer_vecinos),d.map.addInteraction(a.event)},a.proximo=function(){d.map.removeLayer(a.layer_vecinos),c.update_current(),d.map.removeInteraction(a.event),b.path("buscar_semillas")},d.map?a.ready():a.$on("map",a.ready)}]),angular.module("frontApp").controller("BuscarSemillasCtrl",["$scope","$modal","$log","preferences","features","calculos",function(a,b,c,d,e,f){a.total=d.propiedad_suma_total,a.clusters_cantidad=d.cantidad_de_semillas,a.objetivo=d.propiedad_suma_total/d.cantidad_de_semillas,d.set_objetivo(a.objetivo),a.features=e,d.showMap(),a.source=e.get_source(),a.ol_features=a.source.getFeatures(),a.limites={min:Number.MAX_VALUE,max:Number.MIN_VALUE},a.config=function(){var a=b.open({templateUrl:"views/form/config_busqueda.html",controller:"FormConfigBusquedaCtrl"});a.result.then(function(){c.info("Modal exit at: "+new Date)},function(){c.info("Modal dismissed at: "+new Date)})},a.addLayer=function(){a.source_buffer=new ol.source.Vector,a.layer_buffer=new ol.layer.Vector({source:a.source_buffer,style:new ol.style.Style({fill:new ol.style.Fill({color:[0,0,0,.3]})})}),a.source=new ol.source.Vector,a.layer=new ol.layer.Vector({source:a.source,style:function(){return function(a){return[new ol.style.Style({fill:new ol.style.Fill({color:[0,255,0,a.get("rating_alpha")]})})]}}()}),d.map.addLayer(a.layer),a.source_clusters_radios=new ol.source.Vector,a.layer_clusters_radios=new ol.layer.Vector({source:a.source_clusters_radios,style:function(){return function(){return[new ol.style.Style({fill:new ol.style.Fill({color:[0,0,0,.3]})})]}}()}),a.event=new ol.interaction.Select,d.map.addInteraction(a.event);var b=a.event.getFeatures();b.on("add",function(b){if(b.element){a.source_partes.clear();var c=b.element;c.get("_partes").forEach(function(b){a.source_partes.addFeature(a.features_map[b])})}}),a.source_mc=new ol.source.Vector,a.layer_mc=new ol.layer.Vector({source:a.source_mc,style:function(){return function(){return[new ol.style.Style({fill:new ol.style.Fill({color:[255,255,0,.2]})})]}}()}),a.source_pp=new ol.source.Vector,a.layer_pp=new ol.layer.Vector({source:a.source_pp,style:function(){return function(){return[new ol.style.Style({fill:new ol.style.Fill({color:[0,0,255,.2]}),stroke:new ol.style.Stroke({color:[0,0,0,.2],width:2})})]}}()}),d.map.addLayer(a.layer_pp),a.source_partes=new ol.source.Vector,a.layer_partes=new ol.layer.Vector({source:a.source_partes,style:function(){return function(){return[new ol.style.Style({fill:new ol.style.Fill({color:[255,0,0,.3]}),stroke:new ol.style.Stroke({color:[0,0,0,.8],width:2})})]}}()}),d.map.addLayer(a.layer_partes),a.source_mp=new ol.source.Vector,a.layer_mp=new ol.layer.Vector({source:a.source_mp,style:function(){return function(){return[new ol.style.Style({fill:new ol.style.Fill({color:[0,255,255,1]})})]}}()}),d.map.addLayer(a.layer_mp),a.source_clusters=new ol.source.Vector,a.layer_clusters=new ol.layer.Vector({source:a.source_clusters,style:function(){return function(a){{var b=parseInt(a.get(d.propiedad_para_calcular))/d.propiedad_objetivo;a.getId()}return[new ol.style.Style({fill:new ol.style.Fill({color:a.get("_color")}),stroke:new ol.style.Stroke({color:[0,0,0,.8]}),text:new ol.style.Text({font:"12px Calibri,sans-serif",text:numeral(b).format("0.00%"),fill:new ol.style.Fill({color:"#000"}),stroke:new ol.style.Stroke({color:"#fff",width:3})})})]}}()}),d.map.addLayer(a.layer_clusters),d.map.addLayer(a.layer_pp),d.map.addLayer(a.layer_mc),a.initProcess()},a.initProcess=function(){var b=ol.extent.createEmpty();a.ol_features.forEach(function(c){ol.extent.extend(b,c.getGeometry().getExtent());var e=c.get(d.propiedad_para_calcular);e>a.limites.max&&(a.limites.max=e),e<a.limites.min&&(a.limites.min=e)}),a.ol_features.forEach(function(b){var c=b.get(d.propiedad_para_calcular),e=(c-a.limites.min)/(a.objetivo-a.limites.min);b.set("rating_alpha",e),b.set("rating",a.objetivo-c)});var c=new ol.geom.Polygon([[[b[0],b[1]],[b[0],b[3]],[b[2],b[3]],[b[2],b[1]]]]),e=new ol.Feature({geometry:c});a.source_buffer.addFeature(e),a.radio_preferencial=Math.sqrt(c.getArea()/(Math.PI*a.clusters_cantidad)),a.ol_features.forEach(function(b){a.source.addFeature(b)}),a.cluster_colors=Please.make_color({colors_returned:d.cantidad_de_semillas}),a.seleccionarSemillas(d.delta_semillas)},a.clusters=[],a.clusters_map={},a.semillas_id=[],a.poligonos_asignados=[],a.limites_alpha=[],a.features_map={},a.agregar_semilla=function(b){a.semillas_id.push(b.getId()),a.agregar_poligono_asignado(b);var c=f.crear_cluster(b);c.set("_color",a.cluster_colors.pop()),a.clusters.push(c),a.clusters_map[c.getId()]=c},a.agregar_poligono_asignado=function(b){a.poligonos_asignados.indexOf(b.getId())<0&&a.poligonos_asignados.push(b.getId())},a.seleccionarSemillas=function(b){var c=a.radio_preferencial*b;a.featuresOrdenadas=a.ol_features.sort("max"==d.orden_semillas?function(a,b){return b.get("rating")-a.get("rating")}:function(a,b){return a.get("rating")-b.get("rating")}),a.agregar_semilla(a.featuresOrdenadas[0]),_.each(a.featuresOrdenadas,function(b){var d=b.get("centro")||!1;d||(d=b.getGeometry().getInteriorPoint().getCoordinates(),b.set("centro",d));var e=_.min(a.clusters,function(a){var b=a.get("centro")||!1;b||(b=a.getGeometry().getInteriorPoint().getCoordinates(),a.set("centro",b));var c=new ol.geom.LineString([d,b]);return c.getLength()}),f=new ol.geom.LineString([e.get("centro"),b.get("centro")]).getLength();return a.features_map[b.getId()]=b,f>c&&a.clusters.length<a.clusters_cantidad&&a.agregar_semilla(b),!1}),a.clusters_activos=_.clone(a.clusters),d.set_clusters(a.clusters),a.clusters.forEach(function(b){a.source_clusters.addFeature(_.clone(b));var d=new ol.geom.Point(b.get("centro")).transform("EPSG:3857","EPSG:4326").getCoordinates(),e=new ol.Sphere(6378137),f=ol.geom.Polygon.circular(e,d,c/2).transform("EPSG:4326","EPSG:3857"),g=new ol.Feature({geometry:f});a.source_clusters_radios.addFeature(g)})},a.hacer_todo=!1,a.hay_punto_muerto=!1,a.mejor_cluster=!1,a.mc=function(b){var c,b=b||!1;c=a.hay_punto_muerto?f.cluster_sin_pm(a.clusters):0!=b?a.clusters.filter(function(a){return a.getId()!=b.getId()}):a.clusters,a.source_mc.clear(),a.mejor_cluster=f.mejor_cluster(c,a.features_map,a.poligonos_asignados,d.importancia_compacidad,d.importancia_poblacion),a.source_mc.addFeature(a.mejor_cluster),a.hacer_todo&&setTimeout(a.pp,100)},a.poligonos_posibles=!1,a.pp=function(){return a.source_pp.clear(),a.poligonos_posibles=f.poligonos_posibles(a.mejor_cluster,a.features_map,a.semillas_id,a.poligonos_asignados),0==a.poligonos_posibles.length&&(a.clusters_activos=a.clusters_activos.filter(function(b){return b.getId()!=a.mejor_cluster.getId()}),a.mejor_cluster=!1,a.poligonos_posibles=!1,a.hay_punto_muerto=!0,a.hacer_todo)?void a.mc():(_.each(a.poligonos_posibles,function(b){a.source_pp.addFeature(b)}),void setTimeout(function(){a.hacer_todo&&a.mp()},0))},a.mejor_poligono=!1,a.mp=function(){a.source_mp.clear(),a.mejor_poligono=f.mejor_poligono(a.mejor_cluster,a.clusters,a.clusters_map,a.features_map,a.semillas_id,a.poligonos_asignados,a.poligonos_posibles,d.importancia_compacidad,d.importancia_poblacion),0!=a.mejor_poligono&&a.source_mp.addFeature(a.mejor_poligono),setTimeout(function(){a.hacer_todo&&a.actualizar()},0)},a.actualizar=function(){a.hay_punto_muerto=!f.actualizar(a.mejor_cluster,a.mejor_poligono,a.features_map,a.clusters_map),0!=a.mejor_poligono&&a.agregar_poligono_asignado(a.mejor_poligono),a.mejor_cluster=!1,a.source_mc.clear(),a.poligonos_posibles=!1,a.source_pp.clear(),a.mejor_poligono=!1,a.source_mp.clear(),_.size(a.poligonos_asignados)<_.size(a.features_map)?a.hacer_todo&&setTimeout(function(){a.mc()},100):a.hacer_todo=!1},a.completo=function(){a.hacer_todo=!0,a.mc()},a.pausa=function(){a.hacer_todo=!1},d.map?a.addLayer():a.$on("map",function(){a.addLayer()})}]),angular.module("frontApp").controller("AyudaCtrl",["$scope","$modalInstance",function(a,b){a.cerrar=function(){b.close()},a.contacto=function(){alert("Formulario de contacto. ToDo"),b.close()}}]),angular.module("frontApp").service("calculos",["preferences","features",function a(b,c){var a={};a.hc=function(a,b){var d=c.feature_a_jsts(a),e=4*Math.PI;b&&(d=d.union(c.feature_a_jsts(b)));var f=d.getArea(),g=Math.pow(d.getLength(),2),h=e*f/g;return h},a.hp=function(a,c){var d=a.get(b.propiedad_para_calcular);c&&(d+=c.get(b.propiedad_para_calcular));var e=b.propiedad_objetivo,f=(e-d)/e;return f},a.h=function(b,c,d,e){return a.hp(b,c)*parseInt(e)+a.hc(b,c)*parseInt(d)},a.g=function(b,c,d,e){var f=b.get("_vecinos"),g=(a.frontera_actual(b,e),{cluster:0,g:0});return _.each(c,function(c){var h=a.frontera_actual(c,e);_.each(f,function(f,i){var j=d[i],k=a.frontera_con_poligono(b,j,d,e),l=(h-k)/h;l>g.g&&(g.cluster=c,g.g=l)})}),g.g},a.frontera_actual=function(a,b){var c=_.clone(a.get("_vecinos")),d=0;return _.each(c,function(a,c){c=parseInt(c),b.indexOf(parseInt(c))>=0||(d+=a)}),d},a.frontera_con_poligono=function(b,c,d,e){var f={},g=_.clone(b.get("_partes")),h=(c.get("_vecinos"),0);return"undefined"==typeof f[c.getId()]?a.frontera_actual(b,e):(g.push(c.getId()),partes_id.forEach(function(a){var b=d[a],c=b.get("_vecinos");_.each(c,function(a,b){e.indexOf(parseInt(b))>=0||(h+=a)})}),h)},a.g1=function(b,c,d,e,f){var g=0;return _.each(b,function(b){var e=a.frontera_actual(b,f),h=a.frontera_con_poligono(b,c,d,f);g+=0==e?0:(e-h)/e}),g},a.f=function(b,c,d,e,f,g){return a.h(b,!1,f,g)+a.g(b,c,d,e)},a.f1=function(b,c,d,e,f,g,h,i){return a.g1(c,d,e,f,g)+a.h(b,d,h,i)},a.mejor_cluster=function(b,c,d,e,f){var g=b.sort(function(g,h){return a.f(h,b,c,d,e,f)-a.f(g,b,c,d,e,f)}),h=a.f(g[0],b,c,d,e,f),i=g.filter(function(g){return a.f(g,b,c,d,e,f)==h});return 1==i.length?i[0]:_.max(i,function(a){return _.size(a.get("_vecinos"))})},a.poligonos_posibles=function(a,b,c,d){var e=a.get("_vecinos"),f=a.get("_partes"),g=[];return _.each(e,function(a,c){c=parseInt(c),f.indexOf(c)>=0||d.indexOf(c)>=0||g.push(b[c])}),0==g.length&&_.each(e,function(a,c){c=parseInt(c),f.indexOf(c)>=0||g.push(b[c])}),g},a.id_igual=function(a,b){return parseInt(a)==parseInt(b)},a.rompe_continuidad=function(b,d,e){var f=b.get("_cluster")||!1;if(0==f)return!1;var g=e[f],h=g.get("_partes"),i=!1;return h.forEach(function(e){a.id_igual(e,b.getId())||(i=0==i?c.feature_a_jsts(d[e]):i.union(c.feature_a_jsts(d[e])))}),"Polygon"==i.getGeometryType()?!1:i.geometries.length>1?!0:!1},a.crea_huecos=function(a,b,c){return!1},a.limpia_cluster=function(a,b){var c,d,e=b.get("_cluster")||!1;return 0!=e&&(c=a[e],d=_.clone(c.get("_partes")),1==d.length&&d.indexOf(b.getId())>=0)?!0:!1};var d=0;a.mejor_poligono=function(b,c,d,e,f,g,h,i,j){var k,l=[];_.each(h,function(d){l.push({poligono:d,f1:a.f1(b,c,d,e,f,g,i,j)})});var m=_.max(l,function(a){return a.f1});if(a.limpia_cluster(d,m.poligono)||a.crea_huecos(b,m.poligono,e)||a.rompe_continuidad(m.poligono,e,d)){if(1==h.length)return!1;h=h.filter(function(b){return!a.id_igual(b.getId(),m.poligono.getId())}),k=a.mejor_poligono(b,c,d,e,f,g,h,i,j)}else k=m.poligono;return k},a.actualizar=function(b,c,e,f){if(d++,0==c)return a.pm(b)?!1:!0;var g=c.get("_cluster")||!1;if(0==g)return a.cluster_agregar(b,c,e),!0;var h=f[g];return a.cluster_quitar(h,c,e),a.cluster_agregar(b,c,e),a.pm(b)?!1:!0},a.cluster_agregar=function(b,c,d){var e=b.get("_partes")||[];e.push(c.getId()),b.set("_partes",e),c.set("_cluster",b.getId()),a.actualizar_cluster(b,d)},a.cluster_quitar=function(b,c,d){var e=b.get("_partes")||[];e=_.filter(e,function(b){return!a.id_igual(c.getId(),b)}),b.set("_partes",e),c.set("_cluster",!1),a.actualizar_cluster(b,d)},a.actualizar_cluster=function(a,d){var e=a.get("_partes"),f={},g=0,h=!1;e.forEach(function(a){var i=d[a],j=i.get("_vecinos");_.each(j,function(a,b){e.indexOf(b)>=0||(f[b]=(f[b]||0)+a)}),h=0==h?c.feature_a_jsts(i):h.union(c.feature_a_jsts(i)),g+=parseInt(i.get(b.propiedad_para_calcular))}),a.set(b.propiedad_para_calcular,g),a.set("_vecinos",f);var i=c.jsts_a_feature(h);a.setGeometry(i.getGeometry())};var e=[];return a.pm=function(a){e.unshift({cluster:a.getId(),iteracion:d});var b=d+1,c=(a.getId(),0);return _.every(e,function(a){return b--,c++,a.iteracion==b}),c>2},a.cluster_sin_pm=function(a){var b=d+1;e=e.filter(function(a){return b--,a.iteracion==b});var c=_.pluck(e,"cluster"),f=_.filter(a,function(a){return c.indexOf(a.getId())<0});return f},a.crear_cluster=function(a){var c=new ol.Feature({geometry:a.getGeometry(),nombre:a.get("NOMBRE"),_partes:[a.getId()],_vecinos:a.get("_vecinos")});return c.setId(a.getId()),a.set("_cluster",c.getId()),c.set(b.propiedad_para_calcular,a.get(b.propiedad_para_calcular)),c},a}]),angular.module("frontApp").controller("FormConfigBusquedaCtrl",["$scope","$modalInstance","preferences",function(a,b,c){a.preferences=c,a.ok=function(){c.persistir(),b.close()},a.cancel=function(){c.init(),b.dismiss()}}]),angular.module("frontApp").directive("selectpicker",function(){return{restrict:"A",link:function(a,b){b.selectpicker()}}});