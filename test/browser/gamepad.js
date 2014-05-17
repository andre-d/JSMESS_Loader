define(function(require) {
  'use strict';

  var gamepad = require('../../lib/features/gamepad');

  // Mock the native getGamepads method.
  gamepad.getGamepads = function() {
    return [{ id: 404 }];
  };

  describe('Gamepad (Browser)', function() {
    it('is supported', function() {
      expect(gamepad.isSupported).to.equal(true);
    });

    describe('polling', function() {
      it('receives connected devices', function(done) {
        gamepad.pollForDevices(function(connected) {
          expect(connected[0].id).to.equal(404);
          expect(gamepad.connected[404]).to.equal(connected[0]);
          expect(this.stop).to.be.a('function');

          this.stop();
          done();
        });
      });
    });
  });
});
