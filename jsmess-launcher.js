(function() {
  function get(name) {
    if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search)) {
      return decodeURIComponent(name[1]);
    }
  }

  var games;
  var mess;
  var module;

  function getmodule() {
    module = get('module');
    module = module ? module : 'test';
  }

  function getextrahtml() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', module + '.html');
    xhr.onload = function() {
      if (xhr.status == 200) {
        document.body.innerHTML += xhr.response;
      }
    };
    xhr.send();
  }

  function getgamelist() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', module + '-gamelist.json', true);
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
    getextrahtml();
    if(!get('game')) {
      getgamelist();
    } else {
      ready();
    }
  }

  function ready() {
    var select = document.getElementById('selgame'); 

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

    var output = document.getElementById('output');
    var canvas = document.getElementById('canvas');
    mess = new JSMESS(canvas, undefined, get('debug') ? output : undefined)
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
    mess.setgame(game ? 'roms/' + module + '/' + game : undefined);
  }

  function switchgame(e) {
    setgame(e.target.value);
  }

  window.addEventListener('load', init);
})();

