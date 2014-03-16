// All `define` calls to be used within Node and have the standard require
// look them up.
require('amdefine/intercept');

// Globally export the expect variable for testing.
global.expect = require('chai').expect;

// Export the global object as window.
global.window = global;

// Globally expose the AudioContext constructor from the Web Audio API.
global.AudioContext = require('web-audio-api').AudioContext;
