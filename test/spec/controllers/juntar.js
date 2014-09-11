'use strict';

describe('Controller: JuntarCtrl', function () {

  // load the controller's module
  beforeEach(module('frontApp'));

  var JuntarCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    JuntarCtrl = $controller('JuntarCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
