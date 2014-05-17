var Module;

/**
 * @module lib/loader
 */
define(function(require, exports, module) {
  'use strict';

  var getSampleRate = require('./utils/get_sample_rate');
  var getRequest = require('./utils/get_request');

  function JSMESS(canvas, module, game, precallback, callback, scale) {
    var js_data;
    var moduledata;
    var drawloadingtimer;
    var file_countdown;
    var spinnerrot = 0;
    var splashimg = new Image();
    var spinnerimg = new Image();
    var mute = true;

    this.setmuted = function(_mute) {
      mute = _mute;
      if (typeof Module != 'undefined') {
          Module.ccall('SDL_PauseAudio', '', ['number'], [mute ? 1 : 0]);
      }
      return this;
    };

    this.setscale = function(_scale) {
      scale = _scale;
      return this;
    };

    this.setprecallback = function(_precallback) {
      precallback = _precallback;
      return this;
    };

    this.setcallback = function(_callback) {
      callback = _callback;
      return this;
    };

    this.setmodule = function(_module) {
      module = _module;
      return this;
    };

    this.setgame = function(_game) {
      game = _game;
      return this;
    };

    var draw_loading_status = function() {
      var context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(splashimg, canvas.width / 2 - (splashimg.width / 2), canvas.height / 3 - (splashimg.height / 2));
      var spinnerpos = (canvas.height / 2 + splashimg.height / 2) + 16;
      context.save();
      context.translate((canvas.width / 2), spinnerpos);
      context.rotate(spinnerrot);
      context.drawImage(spinnerimg, -(64/2), -(64/2), 64, 64);
      context.restore();
      spinnerrot += 0.25;
    };

    var progress_fetch_file = function(e) {
      if (e.lengthComputable) {
        e.target.progress = e.loaded / e.total;
        e.target.loaded = e.loaded;
        e.target.total = e.total;
        e.target.lengthComputable = e.lengthComputable;
      }
    };

    var fetch_file = function(title, url, cb, rt, raw, unmanaged) {
      var xhr = getRequest(url, function(resp) {
        if (!unmanaged) {
          xhr.progress = 1.0;
        }
        var ints = raw ? resp : new Int8Array(resp);
        cb(ints);
      });

      xhr.responseType = rt ? rt : 'arraybuffer';

      if (!unmanaged) {
        xhr.onprogress = progress_fetch_file;
        xhr.title = title;
        xhr.progress = 0;
        xhr.total = 0;
        xhr.loaded = 0;
        xhr.lengthComputable = false;
      }
    };

    var update_countdown = function() {
      file_countdown -= 1;
      if (file_countdown <= 0) {
        window.clearInterval(drawloadingtimer);
        var headID = document.getElementsByTagName('head')[0];
        var newScript = document.createElement('script');
        newScript.type = 'text/javascript';
        newScript.text = js_data;
        headID.appendChild(newScript);
      }
    };

    var self = this;

    var init_module = function() {
      var modulecfg = JSON.parse(moduledata);

      var game_file = null;
      var bios_filenames = modulecfg.bios_filenames;
      var bios_files = {};

      var nr = modulecfg.native_resolution;

      canvas.style.width = (nr[0] * scale) + 'px';
      canvas.style.height = (nr[1] * scale) + 'px';
      canvas.width = nr[0] * scale;
      canvas.height = nr[1] * scale;

      var args = [
        modulecfg.driver,
        '-verbose',
        '-rompath','.',
        '-window',
        '-resolution', nr[0]+'x' + nr[1],
        '-nokeepaspect'
      ];
      if (game) {
        args.push('-' + modulecfg.peripherals[0], game.replace(/\//g,'_'));
      }

      var sampleRate = getSampleRate();
      if (sampleRate) {
        args.push('-samplerate', sampleRate.toString());
      }

      if (modulecfg.extra_args) {
        args = args.concat(modulecfg.extra_args);
      }

      Module = {
        arguments: args,
        SDL_numSimultaneouslyQueuedBuffers: 5,
        screenIsReadOnly: true,
        print: (function() {
          return function(text) {
            console.log(text);
          };
        })(),
        canvas: canvas,
        noInitialRun: false,
        preInit: function() {
          // Load the downloaded binary files into the filesystem.
          for (var bios_fname in bios_files) {
            if (bios_files.hasOwnProperty(bios_fname)) {
              Module.FS_createDataFile('/', bios_fname, bios_files[bios_fname], true, true);
            }
          }
          if (game) {
              Module.FS_createDataFile('/', game.replace(/\//g,'_'), game_file, true, true);
          }
          if (callback) {
            modulecfg.canvas = canvas;
            window.setTimeout(function() {
              callback(modulecfg);
            }, 0);
          }
        }
      };

      bios_filenames = bios_filenames.filter(String);
      file_countdown = bios_filenames.length + (game ? 1 : 0) + 1;

      var biosComplete = function(data) { bios_files[fname] = data; update_countdown(); };

      // Fetch the BIOS and the game we want to run.
      for (var i=0; i < bios_filenames.length; i++) {
        var fname = bios_filenames[i];
        fetch_file('Bios', 'bios/' + fname, biosComplete);
      }

      if (game) {
        fetch_file('Game', game, function(data) { game_file = data; update_countdown(); });
      }

      JSMESS.ready(function() {self.setmuted(mute);});

      fetch_file('Javascript', 'jsmess/' + modulecfg.js_filename, function(data) { js_data = data; update_countdown(); }, 'text', true);
    };

    var keyevent = function(e) {
      if (e.which == 32) {
        e.preventDefault();
        start();
      }
    };

    this.hasStarted = false;
    var start = function() {
      self.hasStarted = true;
      ignorecommonkeys();
      window.removeEventListener('keypress', keyevent);
      drawloadingtimer = window.setInterval(draw_loading_status, 1000/60);
      if (precallback) {
        window.setTimeout(function() {precallback();}, 0);
      }
      fetch_file('ModuleInfo', 'json/' + module + '.json', function(data) { moduledata = data; init_module(); }, 'text', true, true);
      return this;
    };
    this.start = start;

    var drawsplash = function() {
      var context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      splashimg.onload = function(){
        context.drawImage(splashimg, canvas.width / 2 - (splashimg.width / 2), canvas.height / 3 - (splashimg.height / 2));
        context.font = '18px sans-serif';
        context.fillStyle = 'Black';
        context.textAlign = 'center';
        context.fillText('Press the SPACEBAR to start.', canvas.width / 2, (canvas.height / 2) + (splashimg.height / 2));
        context.textAlign = 'start';
      };
      spinnerimg.onload = function() { splashimg.src = 'splash.png'; };
      spinnerimg.src = 'spinner.png';
    };

    var ignorecommonkeys = function() {
        window.addEventListener('keydown', function(e) {
        if([32, 37, 38, 39, 40].indexOf(e.keyCode) > -1) {
                e.preventDefault();
        }
        }, false);
    };

    window.addEventListener('keypress', keyevent);
    drawsplash();
  }

  JSMESS._readySet = false;

  JSMESS._readyList = [];

  JSMESS._runReadies = function() {
    if (JSMESS._readyList) {
      for (var r=0; r < JSMESS._readyList.length; r++) {
        JSMESS._readyList[r].call(window, []);
      }
      JSMESS._readyList = [];
    }
  };

  JSMESS._readyCheck = function() {
    if (JSMESS.running) {
      JSMESS._runReadies();
    } else {
      JSMESS._readySet = setTimeout(JSMESS._readyCheck, 10);
    }
  };

  JSMESS.ready = function(r) {
    if (JSMESS.running) {
      r.call(window, []);
    } else {
      JSMESS._readyList.push(function() { return r.call(window, []); } );
      if (!(JSMESS._readySet)) {
        JSMESS._readyCheck();
      }
    }
  };

  module.exports = JSMESS;
});
