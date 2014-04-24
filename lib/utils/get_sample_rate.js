define(function() {
  'use strict';

  // Feature-detect Audio API.
  var hasAudioContext = 'AudioContext' in window;
  var hasPrefixed = 'webkitAudioContext' in window;

  /** 
   * Returns the sample rate as reported by the Web Audio API.
   *
   * @returns {number} Representing the sample rate, in samples per second,
   *   used by all nodes in this context. 
   */
  function getSampleRate() {
    // If the Audio API is unavailable, gracefully warn the user.
    if (!hasAudioContext && !hasPrefixed) {
      console.warn('Missing Audio API, will be unable to play sound.');

      return;
    }

    // Create a new AudioContext instance.
    var ctx = hasAudioContext ? new AudioContext() : new webkitAudioContext();

    // Return the sampleRate.
    return ctx.sampleRate;
  }

  return getSampleRate;
});
