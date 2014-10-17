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

    calculos.h = function(cluster){
      var actual = cluster.get(preferences.propiedad_para_calcular),
          objetivo = preferences.propiedad_objetivo,
          jsts = features.feature_a_jsts(cluster),
          cuatro_pi = 4*Math.PI,
          perimetro_cuadrado = jsts.getLength() * jsts.getLength();
      //return ( ( objetivo - actual ) / objetivo ) + ( 1 - ((cuatro_pi * jsts.getArea()) / perimetro_cuadrado) );
      return ( ( objetivo - actual ) / objetivo ) + (( cuatro_pi - (perimetro_cuadrado / jsts.getArea())) / cuatro_pi) ;
    }

    calculos.g = function(cluster,features_libres){
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
        if(typeof features_libres[vecino_id] == "undefined"){
          return;
        }
        var vecino = features_libres[vecino_id],
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

    calculos.f = function(cluster,libres){
      return calculos.g(cluster,libres) + calculos.h(cluster);
    }

    calculos.mejor_cluster = function(vector_de_clusters,features_libres){
      var ordenados = vector_de_clusters.sort(function(a,b){
        return calculos.f(b,features_libres) - calculos.f(a,features_libres); //Desendiente
      });

      var mayor = calculos.h(ordenados[0]);
      var mayores = ordenados.filter(function(a){
        return (calculos.f(a,features_libres) == mayor);
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

    calculos.poligonos_posibles = function(cluster,libres){
      var vecinos_id = cluster.get('_vecinos'),
          vecinos = [];
      _.each(vecinos_id,function(frontera_comun,vecino_id){
        if(typeof libres[vecino_id] == 'undefined')
          return;
        vecinos.push(libres[vecino_id]);
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

    calculos.juntar = function(cluster,poligono,libres){
      var jsts_cluster = features.feature_a_jsts(cluster),
          jsts_poligono = features.feature_a_jsts(poligono);

      var union = features.jsts_a_feature(jsts_cluster.union(jsts_poligono));
      cluster.set(preferences.propiedad_para_calcular,cluster.get(preferences.propiedad_para_calcular)+poligono.get(preferences.propiedad_para_calcular));
      cluster.set('NOMBRE',cluster.get('NOMBRE') + ' + ' + poligono.get('NOMBRE'));
      cluster.setId(cluster.getId() +'+'+ poligono.getId());
      cluster.setGeometry(union.getGeometry());

      var vecinos_cluster = cluster.get('_vecinos'),
          vecinos_poligono = poligono.get('_vecinos'),
          vecinos = {};

      //Lo saco como vecino porque ahora es parte
      delete vecinos_cluster[poligono.getId()];

      _.each(vecinos_poligono,function(distancia,featureId){
        //Si no exitia como vecino
        if(typeof vecinos_cluster[featureId] == 'undefined')
          vecinos_cluster[featureId] = distancia;
        else
          vecinos_cluster[featureId] += distancia
        //Lo elimino como vecino de todos sus vecinos
        var vecinos_de_vecino = libres[featureId].get('_vecinos');
        delete vecinos_de_vecino[poligono.getId()];
        libres[featureId].set('_vecinos',vecinos_de_vecino);
      })

      cluster.set('_vecinos',vecinos_cluster);

      delete libres[poligono.getId()];
    }

    return calculos;
  });
