'use strict';

describe('Controller: BuscarSemillasCtrl', function () {

  // load the controller's module
  beforeEach(module('frontApp'));

  var BuscarSemillasCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    BuscarSemillasCtrl = $controller('BuscarSemillasCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
