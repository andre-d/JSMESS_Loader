/**
 * @module lib/launcher
 */
define(function(require) {
  'use strict';

  var JSMESS = require('./loader');

  // Features.
  var gamePad = require('./features/gamepad');
  var mute = require('./features/mute');

  // Utils.
  var getRequest = require('./utils/get_request');
  var parseQueryString = require('./utils/parse_query_string');

  // Parse the location.search QueryString for key/values.
  var params = parseQueryString(location.search);

  var games;


  function getextrahtml(id, folder, file) {
    var moduleinfo = document.getElementById(id);
    if (!moduleinfo) {
      return;
    }

    getRequest(folder + '/' + file + '.html', function(resp) {
      moduleinfo.innerHTML = resp;
    });
  }

  function getgamelist(moduleName) {
    getRequest('json/' + moduleName + '-gamelist.json', function(resp) {
      games = JSON.parse(resp).games;
      ready(moduleName);
    });
  }

  function emustart() {
    var select = document.getElementById('selgame');
    if (select) {
       select.style.display = 'none';
    }
  }

  function init() {
    var moduleName = params.module || 'test';
    getextrahtml('moduleinfo', 'html', moduleName);
    if(!params.game) {
      getgamelist(moduleName);
    } else {
      ready(moduleName);
    }
  }

  function ready(moduleName) {
    // Cache the resusable DOM nodes.
    var dom = {
      fullscreen: document.getElementById('gofullscreen'),
      select: document.getElementById('selgame'),
      mute: document.getElementById('mute'),
      canvas: document.getElementById('canvas')
    };

    // Determine if JSMESS should default to muted or not.
    var shouldMute = params.mute ? params.mute === "true" : true;

    // Schedule the mute for when the loader is ready.
    mute.toggle(shouldMute);

    // Ensure the element exists before binding events to it.
    if (dom.mute) {
      dom.mute.checked = shouldMute;
      dom.mute.addEventListener('click', mute.toggle);
    }

    var mess = new JSMESS(dom.canvas)
      .setprecallback(emustart)
      .setscale(params.scale ? parseFloat(params.scale) : 1)
      .setmodule(moduleName);

    var setgame = function(game, moduleName) {
      game = (game == 'NONE') ? undefined : game;
      if (game) {
         getextrahtml('gameinfo', 'gamehtml', game);
      } else {
         document.getElementById('gameinfo').innerHTML = '';
      }
      mess.setgame(game ? 'roms/' + moduleName + '/' + game : undefined);
    };

    var isfullscreensupported = function() {
      return !!(getfullscreenenabler());
    };

    var getfullscreenenabler = function() {
      return dom.canvas.webkitRequestFullScreen || canvas.mozRequestFullScreen ||
        canvas.requestFullScreen;
    };

    var gofullscreen = function() {
      getfullscreenenabler().call(dom.canvas);
    };

    // If the fullscreen toggle exists and fullscreen is supported bind the
    // toggle event listener.
    if (dom.fullscreen && isfullscreensupported()) {
      dom.fullscreen.addEventListener('click', gofullscreen);
    }
    // Otherwise if only the button exists, set it to a disabled state.
    else if (dom.fullscreen) {
      dom.fullscreen.disabled = true;
    }

    // Build up the games list if they exists.
    if (dom.select && games) {
      for(var i = 0; i < games.length; i++) {
        var o = document.createElement('option');
        o.textContent = games[i];
        o.value = games[i];
        dom.select.appendChild(o);
      }

      dom.select.addEventListener('change', function(e) {
        setgame(e.target.value);
      });
    }
    // Otherwise, hide the selection.
    else if (dom.select) {
      dom.select.style.display = 'none';
    }

    setgame(games ? games[0] : params.game, moduleName);

    if (params.autostart) {
      mess.start();
    }

    // Gamepad text
    if (gamePad.isSupported) {
      var gamepadDiv = document.getElementById('gamepadtext');
      gamepadDiv.innerHTML = 'No gamepads detected. Press a button on a gamepad to use it.';

      gamePad.pollForDevices(function(connected) {
        if (connected.length === 1) {
          gamepadDiv.innerHTML = '1 gamepad detected.';
        }else {
          gamepadDiv.innerHTML = connected.length + ' gamepads detected.';
        }
        if (mess.hasStarted) {
          gamepadDiv.innerHTML += '<br />Restart MESS to use new gamepads.';
        }
      });
    }
  }

  init();
});
