'use strict';

describe('Controller: PreviewShapeCtrl', function () {

  // load the controller's module
  beforeEach(module('frontApp'));

  var PreviewShapeCtrl,
    scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    PreviewShapeCtrl = $controller('PreviewShapeCtrl', {
      $scope: scope
    });
  }));

  it('should attach a list of awesomeThings to the scope', function () {
    expect(scope.awesomeThings.length).toBe(3);
  });
});
