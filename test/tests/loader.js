define(function(require) {
  'use strict';

  var JSMESS = require('../../lib/loader');

  describe('Loader', function() {
    it('exposes a function', function() {
      expect(JSMESS).to.be.a('function');
    });
  });
});
