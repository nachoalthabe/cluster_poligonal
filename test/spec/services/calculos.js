'use strict';

describe('Service: calculos', function () {

  // load the service's module
  beforeEach(module('frontApp'));

  // instantiate service
  var calculos;
  beforeEach(inject(function (_calculos_) {
    calculos = _calculos_;
  }));

  it('should do something', function () {
    expect(!!calculos).toBe(true);
  });

});
