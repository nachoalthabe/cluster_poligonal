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

    calculos.hc = function(cluster){
      var jsts = features.feature_a_jsts(cluster),
          cuatro_pi = 4*Math.PI,
          area = jsts.getArea(),
          perimetro_cuadrado = Math.pow(jsts.getLength(),2);
      return 1-( (cuatro_pi*area)/perimetro_cuadrado );
    }
    calculos.hp = function(cluster){
      var actual = cluster.get(preferences.propiedad_para_calcular),
          objetivo = preferences.propiedad_objetivo;
      return Math.abs( ( objetivo - actual ) / objetivo );
      //return ( objetivo - actual ) / objetivo;
    }

    calculos.h = function(cluster){
      return calculos.hp(cluster) + calculos.hc(cluster) ;
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
        var frontera_k = calculos.frontera_actual(k,poligonos_asignados);
        //calculo todas las posibles fronteras
        _.each(vecinos,function(frontera,vecino_id){
          var vecino = poligonos[vecino_id];
          var frontera_k_i = calculos.frontera_con_poligono(cluster,vecino,poligonos_asignados);
          var k_i_g = Math.abs((frontera_k-frontera_k_i)/frontera_k);
          if (k_i_g > mayor.g){
            mayor.cluster = k,
            mayor.g = k_i_g;
          }
        });
      })


      return mayor.g;
    }

    calculos.frontera_actual = function(cluster,poligonos_asignados){
      var vecinos = _.clone(cluster.get('_vecinos')),
          frontera_suma = 0;

      _.each(vecinos,function(frontera,vecino_id){
        vecino_id = parseInt(vecino_id);
        if(poligonos_asignados.indexOf(vecino_id) >= 0)
          return;
        frontera_suma += frontera;
      });

      return frontera_suma;
    };

    calculos.frontera_con_poligono = function(cluster,poligono,poligonos_asignados){
      var vecinos = _.clone(cluster.get('_vecinos')),
          partes = cluster.get('_partes'),
          poligono_vecinos = poligono.get('_vecinos'),
          frontera_suma = 0;
      if(typeof vecinos[poligono.getId()] == 'undefined')
        return 0;
      _.each(poligono_vecinos,function(frontera,vecino_id){
        vecino_id = parseInt(vecino_id);
        if(poligonos_asignados.indexOf(vecino_id) >= 0)
          return;
        if(partes.indexOf(vecino_id) >= 0)
          return;
        vecinos[vecino_id] = (vecinos[vecino_id] || 0) + frontera;
      });
      _.each(vecinos,function(frontera){
        frontera_suma += frontera;
      });

      return frontera_suma;
    };

    calculos.g1 = function(clusters,poligono,poligonos,semillas,poligonos_asignados){
      var resultado = 0;
      _.each(clusters,function(cluster){
        var actual = calculos.frontera_actual(cluster,poligonos_asignados),
            poligonos_posibles = calculos.poligonos_posibles(cluster,poligonos,semillas,poligonos_asignados),
            pp_id = _.map(poligonos_posibles, function(poligono){
              return poligono.getId();
            });

        var id = parseInt(poligono.getId());
        if(pp_id.indexOf(id) >= 0){
          var frontera_nueva = calculos.frontera_con_poligono(cluster,poligono,poligonos_asignados);
          resultado += (actual-frontera_nueva)/actual;
        }
      });
      return resultado;
    }

    calculos.f = function(cluster,clusters,poligonos,poligonos_asignados){
      return calculos.g(cluster,clusters,poligonos,poligonos_asignados) + calculos.h(cluster);
    }

    calculos.f1 = function(clusters,poligono,poligonos,semillas,poligonos_asignados){
      return calculos.g1(clusters,poligono,poligonos,semillas,poligonos_asignados) + calculos.h(cluster);
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
        return  _.min(mayores,function(cluster){
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
        if(semillas.indexOf(vecino_id) >= 0)
          return;
        if(partes.indexOf(vecino_id) >= 0)
          return;
        if(poligonos_asignados.indexOf(vecino_id) >= 0)
          return
        vecinos.push(features[vecino_id]);
      });

      if (vecinos.length == 0){
        _.each(vecinos_id,function(frontera_comun,vecino_id){
          vecino_id = parseInt(vecino_id);
          if(semillas.indexOf(vecino_id) >= 0)
            return;
          if(partes.indexOf(vecino_id) >= 0)
            return;
          vecinos.push(features[vecino_id]);
        });
      }
      return vecinos;
    }

    //Todas las partes deven ser vecinas de otra parte
    calculos.rompe_continuidad = function(cluster,poligono,poligonos){
      var jsts_cluster = features.feature_a_jsts(cluster),
          jsts_poligono = features.feature_a_jsts(poligono);

      return !(jsts_cluster.difference(jsts_poligono).getGeometryType() == 'Polygon');
    }

    var iteracion = 0;
    calculos.mejor_poligono = function(cluster,clusters,clusters_map,poligonos,semillas,poligonos_asignados,posibles_vecinos){
      var fronteras_posibles = [],
          resultado;


      //calculo todas las posibles fronteras
      _.each(posibles_vecinos,function(vecino){
        fronteras_posibles.push({
          poligono: vecino,
          g1: calculos.g1(clusters,vecino,poligonos,semillas,poligonos_asignados)
        })
      });

      var mayor = _.min(fronteras_posibles,function(vecino){
        return vecino.g1
      })

      var cluster_actual = mayor.poligono.get('_cluster') || false;

      if(cluster_actual != false){
        if(calculos.rompe_continuidad(clusters_map[cluster_actual],mayor.poligono,poligonos)){
          if(posibles_vecinos.length == 1){
            return false
          }
          posibles_vecinos = posibles_vecinos.filter(function(poligono){
            return poligono.getId() == mayor.poligono.getId();
          })
          resultado = calculos.mejor_poligono(cluster,clusters,clusters_map,poligonos,semillas,poligonos_asignados,posibles_vecinos)
        }else{
          resultado = mayor.poligono;
        }
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
        calculos.cluster_agregar(cluster,poligono);
        return true;
      }else{
        var cluster_anterior = cluster_map[cluster_asignado];
        calculos.cluster_quitar(cluster_anterior,poligono);
        calculos.cluster_agregar(cluster,poligono);
        if(calculos.pm(cluster)){
          return false;
        }else{
          return true;
        }
      }
    }

    calculos.cluster_agregar= function(cluster,poligono){
      //Lo agrego a la lista de poligonos del cluster
      var partes = cluster.get('_partes') || [];
      partes.push(poligono.getId());
      //Elimino la frontera en el cluster
      var vecinos_poligono = poligono.get('_vecinos'),
          vecinos_cluster = cluster.get('_vecinos');
      delete vecinos_cluster[poligono.getId()];
      //Sumo las fronteras del nuevo poligono
      _.each(vecinos_poligono,function(frontera,id){
        id = parseInt(id);
        if(partes.indexOf(id) >= 0){
          return;
        }
        vecinos_cluster[id] = (vecinos_cluster[id] || 0) + frontera;
      })
      //Actualizo variables
      cluster.set('_partes',partes);
      cluster.set('_vecinos',vecinos_cluster);
      cluster.set(preferences.propiedad_para_calcular,cluster.get(preferences.propiedad_para_calcular)+poligono.get(preferences.propiedad_para_calcular));
      poligono.set('_cluster',cluster.getId());
      //Actualizo geometria
      var jsts_cluster = features.feature_a_jsts(cluster),
          jsts_poligono = features.feature_a_jsts(poligono);

      var union = features.jsts_a_feature(jsts_cluster.union(jsts_poligono));
      cluster.setGeometry(union.getGeometry());
    };

    calculos.cluster_quitar= function(cluster,poligono){
      //Lo quito de la lista de poligonos del cluster
      var partes = cluster.get('_partes') || [];
      partes = _.filter(partes,function(id){
        return (poligono.getId() != id);
      });
      //Agrego vecindad al cluster siempre que sea con alguna de sus componentes
      var vecinos_poligono = poligono.get('_vecinos'),
          vecinos_cluster = cluster.get('_vecinos');
      _.each(vecinos_poligono,function(frontera,id){
        if(partes.indexOf(id) < 0){
          return;
        }
        current = vecinos_cluster[id] || 0;
        vecinos_cluster[id] += frontera;
      })
      //Actualizo variables
      cluster.set('_partes',partes);
      cluster.set('_vecinos',vecinos_cluster);
      cluster.set(preferences.propiedad_para_calcular,cluster.get(preferences.propiedad_para_calcular)-poligono.get(preferences.propiedad_para_calcular));
      poligono.set('_cluster',false);
      //Actualizo geometria
      var jsts_cluster = features.feature_a_jsts(cluster),
          jsts_poligono = features.feature_a_jsts(poligono);


      var difference = features.jsts_a_feature(jsts_cluster.difference(jsts_poligono));
      cluster.setGeometry(difference.getGeometry());
    };

    var pm_log = [];
    calculos.pm = function(cluster){
      pm_log.push({
        cluster: cluster.getId(),
        itercacion: iteracion
      })
      pm_log = pm_log.slice(0,preferences.cantidad_de_semillas);
      var consecutivos = iteracion,
          cluster_id = cluster.getId(),
          pm_cant = 0;
      _.every(pm_log,function(pm_reg,index){
        consecutivos --;
        pm_cant ++;
        return (pm_reg.iteracion == consecutivos)//si es consegutivo
            && (pm_reg.cluster != cluster_id);//y no es el mismo cluster
      });
      return (pm_cant == preferences.cantidad_de_semillas);//Si llego al k-1 sin encontrarlo o con un salto en la secuencia
    }

    calculos.cluster_sin_pm = function(clusters){
      var pm_log_ids = _.pluck(pm_log,'cluster'),
          cluster_id = pm_log_ids.pop(),
          sucios = _.filter(pm_log_ids,function(pm_id,index){
            return (pm_id != cluster_id);//y no es el mismo cluster
          }),
          limpios = _.filter(clusters,function(cluster){
            return (sucios.indexOf(cluster.getId()) < 0);
          })
      return limpios;//Si llego al k-1 sin encontrarlo o con un salto en la secuencia
    }

    calculos.crear_cluster = function(feature){
      var cluster = new ol.Feature({
        geometry: feature.getGeometry(),
        _partes: [feature.getId()],
        _vecinos: feature.get('_vecinos')
      });
      cluster.setId(feature.getId());
      cluster.set(preferences.propiedad_para_calcular,feature.get(preferences.propiedad_para_calcular));
      return cluster;
    }

    return calculos;
  });
