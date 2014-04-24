/**
 * @module lib/launcher
 */
define(function(require) {
  'use strict';

  var JSMESS = require('./loader');
  var gamePad = require('./features/gamepad');
  var getRequest = require('./utils/get_request');
  var parseQueryString = require('./utils/parse_query_params');

  var params = parseQueryParams(location.search);

  function get(name) {
    var expr = '[?&]' + encodeURIComponent(name) + '=([^&]*)';
    var match = RegExp(expr).exec(location.search);

    return match ? decodeURIComponent(match[1]) : null;
  }

  var games;
  var mess;
  var module;

  function getfullscreenenabler() {
    return canvas.webkitRequestFullScreen || canvas.mozRequestFullScreen || canvas.requestFullScreen;
  }

  function isfullscreensupported() {
   return !!(getfullscreenenabler());
  }

  function getmodule() {
    module = get('module');
    module = module ? module : 'test';
  }

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
    getmodule();
    getextrahtml('moduleinfo', 'html', module);
    if(!get('game')) {
      getgamelist();
    } else {
      ready();
    }
  }

  function ready() {
    var fullscreenbutton = document.getElementById('gofullscreen');
    var select = document.getElementById('selgame');
    var mute = document.getElementById('mute');

    if (fullscreenbutton) {
       if (isfullscreensupported()) {
       fullscreenbutton.addEventListener('click', gofullscreen);
       } else {
       fullscreenbutton.disabled = true;
       }
    }
    if (select) {
      if(!games) {
        select.style.display = 'none';
      } else {
        for(var i = 0; i < games.length; i++) {
          var o = document.createElement('option');
          o.textContent = games[i];
          o.value = games[i];
          select.appendChild(o);
        }
        select.addEventListener('change', switchgame);
      }
    }

    var canvas = document.getElementById('canvas');
    var shouldMute = get('mute') ? parseInt(get('mute')) : true;
    mess = new JSMESS(canvas)
      .setprecallback(emustart)
      .setscale(get('scale') ? parseFloat(get('scale')) : 1)
      .setmuted(shouldMute)
      .setmodule(module);
    if (mute) {
        mute.checked = !!shouldMute;
        mute.addEventListener('click', switchmute);
    }
    setgame(games ? games[0] : get('game'));
    if (get('autostart')) {
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

  function setgame(game) {
    game = (game == 'NONE') ? undefined : game;
    if (game) {
       getextrahtml('gameinfo', 'gamehtml', game);
    } else {
       document.getElementById('gameinfo').innerHTML = '';
    }
    mess.setgame(game ? 'roms/' + module + '/' + game : undefined);
  }

  var switchmute = function(/*e*/) {
    mess.setmuted(this.checked);
  };

  function switchgame(e) {
    setgame(e.target.value);
  }


  function gofullscreen() {
    getfullscreenenabler().call(canvas);
  }

  init();
});
