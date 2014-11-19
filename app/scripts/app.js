'use strict';

/**
 * @ngdoc overview
 * @name frontApp
 * @description
 * # frontApp
 *
 * Main module of the application.
 */
angular
  .module('frontApp', [
    'ngAnimate',
    'ngCookies',
    'ngResource',
    'ngRoute',
    'ngSanitize',
    'ngTouch',
    'ui.bootstrap'
  ])
  .config(function ($routeProvider) {
    $routeProvider
      // .when('/', {
      //   templateUrl: 'views/main.html',
      //   controller: 'MainCtrl'
      // })
      .when('/about', {
        templateUrl: 'views/about.html',
        controller: 'AboutCtrl'
      })
      .when('/', {
        templateUrl: 'views/index.html',
        controller: 'IndexCtrl'
      })
      .when('/calcular_vecinos', {
        templateUrl: 'views/procesar_vecinos.html',
        controller: 'ProcesarVecinosCtrl'
      })
      .when('/juntar', {
        templateUrl: 'views/juntar.html',
        controller: 'JuntarCtrl'
      })
      .when('/separar', {
        templateUrl: 'views/separar.html',
        controller: 'SepararCtrl'
      })
      .when('/buscar_semillas', {
        templateUrl: 'views/buscar_semillas.html',
        controller: 'BuscarSemillasCtrl'
      })
      .when('/form/config_busqueda', {
        templateUrl: 'views/form/config_busqueda.html',
        controller: 'FormConfigBusquedaCtrl'
      })
      .otherwise({
        redirectTo: '/'
      });
  });
