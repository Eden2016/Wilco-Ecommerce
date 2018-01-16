'use strict';

describe('esgApp.version module', function() {
  beforeEach(module('esgApp.version'));

  describe('version service', function() {
    it('should return current version', inject(function(version) {
      expect(version).toEqual('0.1');
    }));
  });
});
