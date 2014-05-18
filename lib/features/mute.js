/**
 * @module lib/features/mute
 */
define(function(require, exports, module) {
  'use strict';

  var JSMESS = require("../loader");

  // Default state is muted.
  var isMuted = true;

  /**
   * Toggle the mute flag 
   *
   * @param {boolean} override - An optional boolean override.
   */
  exports.toggle = function(override) {
    // Either use the provided override or toggle the existing boolean.
    isMuted = typeof override === 'boolean' ? override : !isMuted;

    // Ensure the loader is ready.
    JSMESS.ready(function(Module) {
      Module.ccall('SDL_PauseAudio', '', ['number'], [Number(isMuted)]);
    });
  };
});
