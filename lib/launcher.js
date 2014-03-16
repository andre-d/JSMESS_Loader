require(['./loader'], function(JSMESS) {
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
    var xhr = new XMLHttpRequest();
    xhr.open('GET', folder + '/' + file + '.html');
    xhr.onload = function() {
      if (xhr.status == 200) {
        moduleinfo.innerHTML = xhr.response;
      }
    };
    xhr.send();
  }

  function getgamelist() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'json/' + module + '-gamelist.json', true);
    xhr.onload = function() {
      if (xhr.status == 200) {
        games = JSON.parse(xhr.response).games;
      }
      window.setTimeout(ready, 0);
    };
    xhr.send();
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
    if (detectgamepadsupport()) {
      var gamepadDiv = document.getElementById('gamepadtext');
      gamepadDiv.innerHTML = 'No gamepads detected. Press a button on a gamepad to use it.';
      listenforgamepads(function(gamepads/*, newgamepad*/) {
        if (gamepads.length === 1) {
          gamepadDiv.innerHTML = '1 gamepad detected.';
        } else {
          gamepadDiv.innerHTML = gamepads.length + ' gamepads detected.';
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

  function switchmute(/*e*/) {
      mess.setmuted(this.checked);
  }

  function switchgame(e) {
    setgame(e.target.value);
  }


  function gofullscreen() {
      getfullscreenenabler().call(canvas);
  }

  // Firefox will not give us Joystick data unless we register this NOP
  // callback.
  // https://bugzilla.mozilla.org/show_bug.cgi?id=936104
  addEventListener('gamepadconnected', function() {});
  var getgamepads = navigator.getGamepads || navigator.webkitGamepads ||
    navigator.mozGamepads || navigator.gamepads || navigator.webkitGetGamepads;
  /**
   * Does the current browser support the Gamepad API?
   * Returns a boolean.
   */
  function detectgamepadsupport() {
    return typeof getgamepads === 'function';
  }
  // The timer that listens for gamepads, in case we ever want to stop it.
  var gamepadlistener;
  /**
   * Listens for new gamepads, and triggers the callback when it detects a
   * change.
   * The callback is passed an array of active gamepads.
   */
  function listenforgamepads(cb, freq) {
    // NOP if the browser doesn't support gamepads.
    if (!detectgamepadsupport()) return;
    // Map from gamepad id to gamepad information.
    var prevgamepads = {};
    // DEFAULT: Check gamepads every second.
    if (typeof freq === 'undefined') freq = 1000;
    gamepadlistener = setInterval(function() {
      // Browsers get cranky when you don't apply this on the navigator object.
      var gamepads = getgamepads.apply(navigator);
      var currentgamepads = {};
      var i;
      var hasChanged = false;
      for (i = 0; i < gamepads.length; i++) {
        var gamepad = gamepads[i];
        if (gamepad != null) {
          currentgamepads[gamepad.id] = gamepad;
          if (!prevgamepads.hasOwnProperty(gamepad.id)) {
            // Gamepad has been added.
            hasChanged = true;
          }
        }
      }

      // Has a gamepad been removed?
      if (!hasChanged) {
        for (var gamepadid in prevgamepads) {
          if (!currentgamepads.hasOwnProperty(gamepadid)) {
            hasChanged = true;
          }
        }
      }

      prevgamepads = currentgamepads;

      if (hasChanged) {
        // Actual gamepads, filtered from gamepads. Chrome puts empty items into
        // its gamepadlist.
        var actualgamepads = [];
        for (i = 0; i < gamepads.length; i++) {
          if (gamepads[i] != null) actualgamepads.push(gamepads[i]);
        }
        cb(actualgamepads);
      }
    }, freq);
  }

  init();
});
