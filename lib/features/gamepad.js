/**
 * @module lib/gamepad
 */
define(function(require, exports, module) {
  'use strict';

  // Firefox will not give us Joystick data unless we register this NOP
  // callback.
  // https://bugzilla.mozilla.org/show_bug.cgi?id=936104
  window.addEventListener('gamepadconnected', function() {});

  var getGamepads = navigator.getGamepads || navigator.webkitGamepads ||
    navigator.mozGamepads || navigator.gamepads || navigator.webkitGetGamepads;

  /**
   * Browser normalized and bound navigator.getGamepads method.
   *
   * @public
   */
  exports.getGamepads = getGamepads ? getGamepads.bind(navigator) : null;

  /**
   * Does the current browser support the Gamepad API?
   *
   * @public
   */
  exports.isSupported = typeof exports.getGamepads === 'function';

  /**
   * What devices are currently connected?
   *
   * @public
   */
  exports.connected = {};

  /**
   * Listens for new gamepads, and triggers the callback when it detects a
   * change.
   * The callback is passed an array of active gamepads.
   */
  exports.pollForDevices = function(callback, frequency) {
    // NOP if the browser doesn't support gamepads.
    if (!exports.isSupported) {
      // Maintain API parity with real stopper function.
      return { stop: function() {} };
    }

    // If you ever want to stop looping, set this to false.
    var loop = true;

    // The loop stopping method.
    var stopper = {
      stop: function() { loop = false; }
    };

    // DEFAULT: Check gamepads every second.
    if (typeof frequency === 'undefined') {
      frequency = 1000;
    }

    function loopDevices() {
      var gamepads = exports.getGamepads();
      var current = {};
      var hasChanged = false;

      // Find newly added gamepad devices.
      for (var i = 0; i < gamepads.length; i++) {
        var gamepad = gamepads[i];

        // Move on to the next device, this one isn't usable.
        if (gamepad == null) {
          continue;
        }

        // If this gamepad hasn't been seen before, mark this loop as changed.
        if (!exports.connected[gamepad.id]) {
          hasChanged = true;
        }

        // Cache this gamepad in the current object.
        current[gamepad.id] = gamepad;
      }

      // Find removed gamepad devices.
      Object.keys(exports.connected).map(function(key) {
        if (!current[key]) {
          delete exports.connected;
          hasChanged = true;
        }
      });

      // Attach the new list to the exports.
      exports.connected = current;

      // Essentially `Object.values`, turn all values into an array.
      var connectedList = Object.keys(exports.connected).map(function(key) {
        return exports.connected[key];
      });

      // If devices have changed, pass the list.
      if (hasChanged) {
        callback.call(stopper, connectedList);
      }

      // Loop for new devices.
      if (loop) {
        setTimeout(loopDevices, frequency);
      }
    }

    // Initiate polling.
    loopDevices();

    return stopper;
  };
});
