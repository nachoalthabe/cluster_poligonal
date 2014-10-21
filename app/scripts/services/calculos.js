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
      return (cuatro_pi*area)/perimetro_cuadrado;
    }
    calculos.hp = function(cluster){
      var actual = cluster.get(preferences.propiedad_para_calcular),
          objetivo = preferences.propiedad_objetivo;
      return Math.abs( ( objetivo - actual ) / objetivo );
    }

    calculos.h = function(cluster){
      return calculos.hp(cluster) + calculos.hc(cluster) ;
    }

    calculos.g = function(cluster,features){
      var vecinos = cluster.get('_vecinos'),
          frontera_actual = 0,
          vecinos_base = {},
          fronteras_posibles = {},
          mayor_frontera = 0; //{ id: frontera }
      //calculo la frontera actual
      _.each(vecinos,function(frontera,vecino_id){
        frontera_actual += frontera;
        vecinos_base[vecino_id] = frontera;
      });

      //calculo todas las posibles fronteras
      _.each(vecinos,function(frontera,vecino_id){
        var vecino = features[vecino_id],
            vecinos_vecino = vecino.get('_vecinos'),
            vecinos_suma = _.clone(vecinos_base),
            frontera_final = 0;

        //Lo primero es eliminar la frontra comun para simular que es parte del cluster.
        delete vecinos_suma[vecino_id];
        //No lo borro del lado del vecino porque este ya no conoce al cluster.
        _.each(vecinos_vecino,function(frontera,vecino_id){
          if(!vecinos_suma[vecino_id])
            vecinos_suma[vecino_id] = frontera
          else
            vecinos_suma[vecino_id] += frontera;
        });

        //Sumo todas las fronteras y lo cargo en el mapa
        _.each(vecinos_suma,function(frontera){
          frontera_final += frontera;
        })

        fronteras_posibles[vecino_id] = frontera_final;
      });

      //recupero la frontera maxima
      mayor_frontera = _.max(fronteras_posibles,function(frontera){
        return frontera;
      });

      //Calculo G y lo retorno
      return (frontera_actual-mayor_frontera)/frontera_actual
    }

    calculos.f = function(cluster,poligonos){
      return calculos.g(cluster,poligonos) + calculos.h(cluster);
    }

    calculos.mejor_cluster = function(vector_de_clusters,features){
      var ordenados = vector_de_clusters.sort(function(a,b){
        return calculos.f(b,features) - calculos.f(a,features); //Desendiente
      });

      var mayor = calculos.h(ordenados[0]);
      var mayores = ordenados.filter(function(a){
        return (calculos.f(a,features) == mayor);
      });

      if(mayores.length == 1){
        return mayores[0]; //Retorno el mejor
      }else{
        //Evaluo el que tenga mas poligonos libres vecinos
        return  _.min(vector_de_clusters,function(cluster){
          //Cantidad de vecinos
          return _.size(cluster.get('_vecinos'));
        });
      }
    }

    calculos.poligonos_posibles = function(cluster,features){
      var vecinos_id = cluster.get('_vecinos'),
          vecinos = [];
      _.each(vecinos_id,function(frontera_comun,vecino_id){
        vecinos.push(features[vecino_id]);
      })
      return vecinos;
    }

    calculos.mejor_poligono = function(cluster,posibles_vecinos){
      var vecinos_base = cluster.get('_vecinos'),
          fronteras_posibles = [];

      //calculo todas las posibles fronteras
      _.each(posibles_vecinos,function(vecino){
        var vecinos_vecino = vecino.get('_vecinos'),
            vecinos_suma = _.clone(vecinos_base),
            frontera_final = 0;
        //Lo primero es eliminar la frontra comun para simular que es parte del cluster.
        delete vecinos_suma[vecino.getId()];
        //No lo borro del lado del vecino porque este ya no conoce al cluster.
        _.each(vecinos_vecino,function(frontera,vecino_id){
          if(!vecinos_suma[vecino_id])
            vecinos_suma[vecino_id] = frontera
          else
            vecinos_suma[vecino_id] += frontera;
        });

        //Sumo todas las fronteras y lo cargo en el mapa
        _.each(vecinos_suma,function(frontera){
          frontera_final += frontera;
        })

        fronteras_posibles.push({
          poligono: vecino,
          frontera: frontera_final
        });
      });

      var mayor = _.max(fronteras_posibles,function(vecino){
        return vecino.frontera
      })

      return mayor.poligono;
    }

    var iteracion = 0;
    calculos.actualizar = function(cluster,poligono,cluster_map){
      iteracion ++;
      var cluster_asignado = poligono.get('_cluster') || false;
      if (cluster_asignado == false){
        calculos.cluster_agregar(cluster,poligono);
        return true;
      }else{
        var cluster_anterior = cluster_map[cluster.getId()];
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
      var partes = cluster.get('_partes') | [];
      partes.push(poligono.getId());
      //Elimino la frontera en el cluster
      var vecinos_poligono = poligono.get('_vecinos'),
          vecinos_cluster = cluster.get('_vecinos');
      delete vecinos_cluster[poligono.getId()];
      //Sumo las fronteras del nuevo poligono
      _.each(vecinos_poligono,function(frontera,id){
        if(partes.indexOf(id) >= 0){
          return;
        }
        current = vecinos[id] || 0;
        vecinos[id] += frontera;
      })
      //Actualizo variables
      cluster.set('_partes',partes);
      cluster.set('_vecinos',vecinos);
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
      var partes = cluster.get('_partes') | [];
      partes = _.filter(partes,function(id){
        return (poligono.getId() =! id);
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
      cluster.set('_vecinos',vecinos);
      cluster.set(preferences.propiedad_para_calcular,cluster.get(preferences.propiedad_para_calcular)-poligono.get(preferences.propiedad_para_calcular));
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
          cluster_id = cluster.getId();
      _.every(pm_log,function(pm_reg,index){
        consecutivos --;
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

    return calculos;
  });
