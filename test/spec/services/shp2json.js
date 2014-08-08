'use strict';

describe('Service: shp2json', function () {

  // load the service's module
  beforeEach(module('frontApp'));

  // instantiate service
  var shp2json;
  beforeEach(inject(function (_shp2json_) {
    shp2json = _shp2json_;
  }));

  it('should do something', function () {
    expect(!!shp2json).toBe(true);
  });

});
