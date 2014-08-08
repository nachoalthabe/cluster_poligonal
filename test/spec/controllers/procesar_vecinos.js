'use strict';

describe('Controller: ProcesarVecinosCtrl', function () {

  // load the controller's module
  beforeEach(module('frontApp'));

  var ProcesarVecinosCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    ProcesarVecinosCtrl = $controller('ProcesarVecinosCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
