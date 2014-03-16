define(function(require) {
  'use strict';

  var getSampleRate = require('../../../lib/utils/get_sample_rate');

  describe('utils/getSampleRate', function() {
    it('exposes a function', function() {
      expect(getSampleRate).to.be.a('function');
    });

    it('never errors regardless of Web Audio API presence', function() {
      expect(getSampleRate).to.not.throw(Error);
    });

    it('returns a number for the sample rate', function() {
      var retVal = getSampleRate();

      expect(retVal).to.be.a('number');
    });
  });
});
