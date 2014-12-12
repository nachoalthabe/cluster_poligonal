'use strict';

/**
 * @ngdoc service
 * @name frontApp.calculos
 * @description
 * # calculos
 * Service in the frontApp.
 */
angular.module('frontApp')
  .service('calculos', function calculos(preferences,features) {
    var calculos = {};

    calculos.hc = function(cluster,poligono){
      var jsts = features.feature_a_jsts(cluster),
          cuatro_pi = 4*Math.PI;
      if(poligono || false){
        jsts = jsts.union(features.feature_a_jsts(poligono));
      }
      var area = jsts.getArea(),
          perimetro_cuadrado = Math.pow(jsts.getLength(),2);
      var response = ( (cuatro_pi*area)/perimetro_cuadrado );
      return response;
    }
    calculos.hp = function(cluster,poligono){
      var actual = cluster.get(preferences.propiedad_para_calcular)
      if(poligono || false){
        actual += poligono.get(preferences.propiedad_para_calcular);
      }
      var objetivo = preferences.propiedad_objetivo;
      var response = ( objetivo - actual ) / objetivo;
      return response;
    }

    calculos.h = function(cluster,poligono){
      return calculos.hp(cluster,poligono) + calculos.hc(cluster,poligono) ;
    }

    //Calcular por todos los clusters el impacto de sumarles cada uno de los posibles vesinos del cluster a calcular.
    //Retornar el mayor valor
    calculos.g = function(cluster,clusters,poligonos,poligonos_asignados){
      var vecinos = cluster.get('_vecinos'),
          frontera_actual = calculos.frontera_actual(cluster,poligonos_asignados),
          fronteras_posibles = {},
          mayor_frontera = 0; //{ id: frontera }

      var mayor = {
        cluster: 0,
        g: 0
      }
      _.each(clusters,function(k){
        //Frontera actual con poligonos libres
        var frontera_k = calculos.frontera_actual(k,poligonos_asignados);
        //calculo todas las posibles fronteras
        _.each(vecinos,function(frontera,vecino_id){
          var vecino = poligonos[vecino_id];
          var frontera_k_i = calculos.frontera_con_poligono(cluster,vecino,poligonos,poligonos_asignados);
          var k_i_g = (frontera_k-frontera_k_i)/frontera_k;
          if (k_i_g > mayor.g){//Fix: Cambio sentido
            mayor.cluster = k,
            mayor.g = k_i_g;
          }
        });
      })


      return mayor.g;
    }

    /*
      Por cada vecino, si no esta asignado, sumo la frontera y la retorno
    */
    calculos.frontera_actual = function(cluster,poligonos_asignados){
      var vecinos = _.clone(cluster.get('_vecinos')),
          frontera_suma = 0;

      //Por cada vecino
      _.each(vecinos,function(frontera,vecino_id){
        vecino_id = parseInt(vecino_id);
        //Si no esta asignado
        if(poligonos_asignados.indexOf(parseInt(vecino_id)) >= 0)
          return;
        //Sumo la frontera
        frontera_suma += frontera;
      });
      //retorno la suma
      return frontera_suma;
    };

    calculos.frontera_con_poligono = function(cluster,poligono,poligonos,poligonos_asignados){
      var vecinos = {},
          partes = _.clone(cluster.get('_partes')),
          poligono_vecinos = poligono.get('_vecinos'),
          frontera_suma = 0;
      //Si no es posible vecino retorno la frontera actual
      if(typeof vecinos[poligono.getId()] == 'undefined')
        return calculos.frontera_actual(cluster,poligonos_asignados);
      //Agrego la nueva parte
      partes.push(poligono.getId());
      //Por cada vecino del cluster incluido el poligono
      //Simulo la nueva matris de vecindad
      partes_id.forEach(function(id){
        var parte = poligonos[id],
            parte_vecinos = parte.get('_vecinos');

        _.each(parte_vecinos,function(frontera,parte_vecino_id){
          if(poligonos_asignados.indexOf(parseInt(parte_vecino_id)) >= 0)
            return;
          frontera_suma += frontera;
        })

      });
      //retorno la suma
      return frontera_suma;
    };

    calculos.g1 = function(clusters,poligono,poligonos,semillas,poligonos_asignados){
      var resultado = 0;
      _.each(clusters,function(cluster){
        var actual = calculos.frontera_actual(cluster,poligonos_asignados),
            posible = calculos.frontera_con_poligono(cluster,poligono,poligonos,poligonos_asignados);
        resultado += (actual == 0)?0:(actual-posible)/actual;
      });
      return resultado;
    }

    calculos.f = function(cluster,clusters,poligonos,poligonos_asignados){
      return calculos.h(cluster) + calculos.g(cluster,clusters,poligonos,poligonos_asignados);
    }

    calculos.f1 = function(cluster,clusters,poligono,poligonos,semillas,poligonos_asignados){
      return calculos.g1(clusters,poligono,poligonos,semillas,poligonos_asignados) + calculos.h(cluster,poligono);
    }



    calculos.mejor_cluster = function(clusters,poligonos,poligonos_asignados){
      var ordenados = clusters.sort(function(a,b){
        return calculos.f(b,clusters,poligonos,poligonos_asignados) - calculos.f(a,clusters,poligonos,poligonos_asignados); //Desendiente
      });

      var mayor = calculos.f(ordenados[0],clusters,poligonos,poligonos_asignados);
      var mayores = ordenados.filter(function(a){
        return (calculos.f(a,clusters,poligonos,poligonos_asignados) == mayor);
      });

      if(mayores.length == 1){
        return mayores[0]; //Retorno el mejor
      }else{
        //Evaluo el que tenga mas poligonos libres vecinos
        return  _.max(mayores,function(cluster){
          //Cantidad de vecinos
          return _.size(cluster.get('_vecinos'));
        });
      }
    }

    //Si hay libres retorna solo esos, si no hay retorna todos.
    calculos.poligonos_posibles = function(cluster,features,semillas,poligonos_asignados){
      var vecinos_id = cluster.get('_vecinos'),
          partes = cluster.get('_partes'),
          vecinos = [];

      _.each(vecinos_id,function(frontera_comun,vecino_id){
        vecino_id = parseInt(vecino_id);
        //if(semillas.indexOf(vecino_id) >= 0)
        //  return;
        if(partes.indexOf(vecino_id) >= 0)
          return;
        if(poligonos_asignados.indexOf(vecino_id) >= 0)
          return
        vecinos.push(features[vecino_id]);
      });

      if (vecinos.length == 0){
        _.each(vecinos_id,function(frontera_comun,vecino_id){
          vecino_id = parseInt(vecino_id);
          //if(semillas.indexOf(vecino_id) >= 0)
          //  return;
          if(partes.indexOf(vecino_id) >= 0)
            return;
          vecinos.push(features[vecino_id]);
        });
      }
      return vecinos;
    }

    calculos.id_igual = function(id1,id2){
      return parseInt(id1) == parseInt(id2);
    }

    //Todas las partes deven ser vecinas de otra parte
    calculos.rompe_continuidad = function(poligono,poligonos,clusters){
      var cluster_id = poligono.get('_cluster') || false;
      if(cluster_id == false)
        return false;

      var cluster = clusters[cluster_id],
          partes_id = cluster.get('_partes'),
          union = false;
      partes_id.forEach(function(id){
        if(calculos.id_igual(id,poligono.getId())){
          //console.log('Sin',partes_id,id);
          return;
        }
        if(union == false){
          union = features.feature_a_jsts(poligonos[id]);
        }else{
          union = union.union(features.feature_a_jsts(poligonos[id]));
        }
      })

      //console.log('Contiguidad',union.getGeometryType(),(union.geometries)?union.geometries.length:0);
      if(union.getGeometryType() == 'Polygon')
        return false;
      if(union.geometries.length > 1){
        return true;
      }
      return false;
    }

    //Crea huecos?
    calculos.crea_huecos = function(cluster,poligono,poligonos){
      return false;
      var partes_id = _.clone(cluster.get('_partes')),
          union = false;
      partes_id.push(poligono.getId());
      partes_id.forEach(function(id){
        if(union == false){
          union = features.feature_a_jsts(poligonos[id]);
        }else{
          union = union.union(features.feature_a_jsts(poligonos[id]));
        }
      })

      if(union.getGeometryType() == 'Polygon'){
        if (union.holes.length > 0){
          return true
        }
      }
      if(union.getGeometryType() == 'Geometry'){
        if (union.geometries.length > 0){
          return true
        }
      }
      return false;
    }

    //Limpia Cluster??
    calculos.limpia_cluster = function(clusters,poligono){
      var cluster_id = poligono.get('_cluster') || false,
          cluster,partes_id;
      if(cluster_id != false){
        cluster = clusters[cluster_id];
        partes_id = _.clone(cluster.get('_partes'));
        if(partes_id.length == 1)
          if(partes_id.indexOf(poligono.getId()) >= 0)
            return true;
      }
      return false;
    }

    var iteracion = 0;
    calculos.mejor_poligono = function(cluster,clusters,clusters_map,poligonos,semillas,poligonos_asignados,posibles_vecinos){
      var fronteras_posibles = [],
          resultado;


      //calculo todas las posibles fronteras
      _.each(posibles_vecinos,function(vecino){
        fronteras_posibles.push({
          poligono: vecino,
          f1: calculos.f1(cluster,clusters,vecino,poligonos,semillas,poligonos_asignados)
        })
      });

      var mayor = _.max(fronteras_posibles,function(vecino){
        return vecino.f1
      })

      if(calculos.limpia_cluster(clusters_map,mayor.poligono) || calculos.crea_huecos(cluster,mayor.poligono,poligonos) || calculos.rompe_continuidad(mayor.poligono,poligonos,clusters_map)){
        if(posibles_vecinos.length == 1){
          return false
        }
        posibles_vecinos = posibles_vecinos.filter(function(poligono){
          return !calculos.id_igual(poligono.getId(),mayor.poligono.getId());
        })
        resultado = calculos.mejor_poligono(cluster,clusters,clusters_map,poligonos,semillas,poligonos_asignados,posibles_vecinos)
      }else{
        resultado = mayor.poligono;
      }
      return resultado;
    }


    calculos.actualizar = function(cluster,poligono,poligonos,cluster_map){
      iteracion ++;
      if(poligono == false){
        if(calculos.pm(cluster)){
          return false;
        }else{
          return true;
        }
      }
      var cluster_asignado = poligono.get('_cluster') || false;
      if (cluster_asignado == false){
        calculos.cluster_agregar(cluster,poligono,poligonos);
        return true;
      }else{
        var cluster_anterior = cluster_map[cluster_asignado];
        calculos.cluster_quitar(cluster_anterior,poligono,poligonos);
        calculos.cluster_agregar(cluster,poligono,poligonos);
        if(calculos.pm(cluster)){
          return false;
        }else{
          return true;
        }
      }
    }

    calculos.cluster_agregar= function(cluster,poligono,poligonos){
      //Lo agrego a la lista de poligonos del cluster
      var partes = cluster.get('_partes') || [];
      partes.push(poligono.getId());
      cluster.set('_partes',partes);
      //Limpio el poligono
      poligono.set('_cluster',cluster.getId());
      //Actualizo geometria
      calculos.actualizar_cluster(cluster,poligonos)
    };

    calculos.cluster_quitar= function(cluster,poligono,poligonos){
      //Lo quito de la lista de poligonos del cluster
      var partes = cluster.get('_partes') || [];
      partes = _.filter(partes,function(id){
        return !calculos.id_igual(poligono.getId(),id);
      });
      cluster.set('_partes',partes);

      //Limpio el poligono
      poligono.set('_cluster',false);

      //Actualizo geometria
      calculos.actualizar_cluster(cluster,poligonos)
    };

    calculos.actualizar_cluster = function(cluster,poligonos){
      var partes_id = cluster.get('_partes'),
          vecinos = {},
          suma_propiedad = 0;

      var union = false;
      partes_id.forEach(function(id){
        var parte = poligonos[id],
            parte_vecinos = parte.get('_vecinos');
        _.each(parte_vecinos,function(frontera,parte_vecino_id){
          if(partes_id.indexOf(parte_vecino_id) >= 0)
            return;
          vecinos[parte_vecino_id] = (vecinos[parte_vecino_id] || 0) + frontera;
        })
        if(union == false){
          union = features.feature_a_jsts(parte);
        }else{
          union = union.union(features.feature_a_jsts(parte));
        }
        suma_propiedad += parseInt(parte.get(preferences.propiedad_para_calcular));
      });

      cluster.set(preferences.propiedad_para_calcular,suma_propiedad);
      cluster.set('_vecinos',vecinos);
      var new_feature = features.jsts_a_feature(union);
      cluster.setGeometry(new_feature.getGeometry());
    }

    var pm_log = [];
    calculos.pm = function(cluster){
      pm_log.unshift({
        cluster: cluster.getId(),
        iteracion: iteracion
      })
      var consecutivos = iteracion+1,
          cluster_id = cluster.getId(),
          pm_cant = 0;
      _.every(pm_log,function(pm_reg,index){
        consecutivos --;
        pm_cant ++;
        return (pm_reg.iteracion == consecutivos);//si es consegutivo
            //&& (pm_reg.cluster != cluster_id);//y no es el mismo cluster
      });
      return (pm_cant > 2);//Si llego al k-1 sin encontrarlo o con un salto en la secuencia
    }

    calculos.cluster_sin_pm = function(clusters){
      var consecutivos = iteracion + 1;
      pm_log = pm_log.filter(function(log){
        consecutivos --;
        return (log.iteracion == consecutivos);
      })
      var sucios = _.pluck(pm_log,'cluster'),
          limpios = _.filter(clusters,function(cluster){
            return (sucios.indexOf(cluster.getId()) < 0);
          })
      return limpios;//Si llego al k-1 sin encontrarlo o con un salto en la secuencia
    }

    calculos.crear_cluster = function(feature){
      var cluster = new ol.Feature({
        geometry: feature.getGeometry(),
        nombre: feature.get('NOMBRE'),
        _partes: [feature.getId()],
        _vecinos: feature.get('_vecinos')
      });
      cluster.setId(feature.getId());
      feature.set('_cluster',cluster.getId());
      cluster.set(preferences.propiedad_para_calcular,feature.get(preferences.propiedad_para_calcular));
      return cluster;
    }

    return calculos;
  });
