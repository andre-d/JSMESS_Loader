(function() {
  function get(name) {
    if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search)) {
      return decodeURIComponent(name[1]);
    }
  }

  var games;
  var mess;
  var module;

  function getfullscreenenabler() {
    return canvas.webkitRequestFullScreen || canvas.mozRequestFullScreen || canvas.requestFullScreen;
  }

  function isfullscreensupported() {
   return !!(getfullscreenenabler())
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
      window.setTimeout(ready, 0)
    };
    xhr.send();
  }

  function emustart() {
    document.getElementById('selgame').style.display = 'none';
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
    mess = new JSMESS(canvas)
      .setprecallback(emustart)
      .setscale(get('scale') ? parseFloat(get('scale')) : 1)
      .setmodule(module);
    setgame(games ? games[0] : get('game'))
    if (get('autostart')) {
      mess.start();
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

  function switchgame(e) {
    setgame(e.target.value);
  }


  function gofullscreen() {
      getfullscreenenabler().call(canvas);
  }

  window.addEventListener('load', init);
})();

