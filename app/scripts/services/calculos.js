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
          jsts = features.feature_a_jsts(cluster)
          4pi = 4*Math.PI,
          comp_a = ( jsts.getLength() * jsts.getLength() ) / jsts.getArea();
      return ( ( objetivo - actual ) / objetivo ) + ( ( 4pi - comp_a ) / 4pi );
    }

    calculos.mejor_cluster = function(vector_de_clusters){
      var ordenados = vector_de_clusters.sort(function(a,b){
        return calculos.h(b) - calculos.h(a); //Desendiente
      });

      var mayor = calculos.h(ordenados[0]);
      var mayores = cluster.filter(function(a){
        return (calculos.h(a) == mayor);
      });

      if(mayores.length == 1){
        return mayores[0]; //Retorno el mejor
      }else{
        //Evaluo el que tenga mas poligonos libres vecinos
        return  _.max(vector_de_clusters,function(cluster){
          //Cantidad de vecinos
          return _.size(cluster.get('_vecinos'));
        });
      }
    }

    return calculos;
  });
