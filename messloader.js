var Module = null;

function JSMESS(canvas, module, output, game) {
  var js_data;
  var moduledata;
  var requests = [];
  var file_countdown  = 1;
  var game = game;
  var module = module;

  this.setgame = function(_module) {
    module = _module;
  }

  this.setgame = function(_game) {
    game = _game;
  }

  var draw_loading_status = function() {
    var font_height = 18;
    var line_height = canvas.height - (font_height * 2);
    var context = canvas.getContext('2d');
    var progress = 0;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = font_height + 'px sans-serif';
    context.fillStyle = 'Black';
    context.fillText('Loading...', 0, font_height);
    for(var i = 0; i < requests.length; i++) {
       var o = requests[i];
       progress += o.progress;
    }
    progress /= requests.length;
    var str;
    if(progress > 1.0) {
      str = 'Loading program...';
    } else {
      var n_progress = Math.round(progress * 100);
      if(n_progress >= 100) {
        str = 'Done';
      } else {
        str =  n_progress + '%';
      }
    }
    var y = (font_height * 2);
    context.fillStyle = 'Red';
    context.fillRect(0, y, canvas.width, line_height);
    context.fillStyle = 'Green';
    context.fillRect(0, y, canvas.width * progress, line_height);
    context.fillStyle = 'Black';
    context.fillText(str, 0, y + (font_height / 2) + (line_height / 2));      
  };

  var progress_fetch_file = function(e) {
    if(e.lengthComputable) {
      e.target.progress = e.loaded / e.total;
      draw_loading_status();
    }
  };

  var fetch_file = function(title, url, cb, rt, raw, unmanaged) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = rt ? rt : 'arraybuffer';
    xhr.onload = function(e) {
      if(!unmanaged) {
        xhr.progress = 1.0;
        draw_loading_status();
      }
      var ints = raw ? xhr.response :  new Int8Array(xhr.response);
      cb(ints);
    };
    if(!unmanaged) {
      xhr.onprogress = progress_fetch_file;
      xhr.title = title;
      xhr.progress = 0;
      requests.push(xhr);
    }
    xhr.send();
  };

  var update_countdown = function() {
    file_countdown -= 1;
    if(file_countdown === 0) {
      var headID = document.getElementsByTagName('head')[0];
      var newScript = document.createElement('script');
      newScript.type = 'text/javascript';
      newScript.text = js_data;
      headID.appendChild(newScript);
    }
  };

  var init_module = function() {
    modulecfg = JSON.parse(moduledata);
    
    var game_file = null;
    var bios_filenames = modulecfg['bios_filenames'];
    var bios_files = {};
    
    if (bios_filenames.length !== 0 && bios_filenames[0] !== '') {
      file_countdown += bios_filenames.length;
    }
    if (game !== '') {
      file_countdown++;
    }
    
    var nr = modulecfg['native_resolution'];
    
    Module = {
      'arguments': [modulecfg['driver'],'-verbose','-rompath','.','-' + modulecfg['peripherals'][0],game,'-window','-resolution',nr[0]+'x' + nr[1],'-nokeepaspect'].concat(modulecfg['extra_args']),
      print: (function() {
        return function(text) {
          if(!output) {
            return;
          }
          text = text.replace(/&/g, '&amp;');
          text = text.replace(/</g, '&lt;');
          text = text.replace(/>/g, '&gt;');
          text = text.replace('\n', '<br>', 'g');
          output.innerHTML += text + '<br>';
          output.scrollTop = output.scrollHeight;
        };
      })(),
      canvas: canvas,
      noInitialRun: false,
      preInit: function() {
        // Load the downloaded binary files into the filesystem.
        for (var bios_fname in bios_files) {
          if (bios_files.hasOwnProperty(bios_fname)) {
            Module['FS_createDataFile']('/', bios_fname, bios_files[bios_fname], true, true);
          }
        }
        Module['FS_createDataFile']('/', game, game_file, true, true);
      }
    };

    // Fetch the BIOS and the game we want to run.
    for (var i=0; i < bios_filenames.length; i++) {
      var fname = bios_filenames[i];
      if (fname === '') {
        continue;
      }
      fetch_file('Bios', fname, function(data) { bios_files[fname] = data; update_countdown(); });
    }

    if (game !== '') {
      fetch_file('Game', 'games/' + game, function(data) { game_file = data; update_countdown(); });
    }

    fetch_file('Javascript', modulecfg['js_filename'], function(data) { js_data = data; update_countdown(); }, 'text', true);
    draw_loading_status();
  };
  
  var keyevent = function(e) {
    if(e.which == 32) {
      window.removeEventListener('keypress', keyevent);
      fetch_file('Javascript', module + '.json', function(data) { moduledata = data; drawsplash(); init_module(); }, 'text', true, true);
    }
  }
  
  var drawsplash = function() {
    var context = document.getElementById('canvas').getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    var img = new Image();
    img.onload = function(){
      context.drawImage(img, 0, 0);
      context.font = '18px sans-serif';
      context.fillStyle = 'Black';
      context.fillText('press space', 0, Math.min(img.height + 18, canvas.height - 18));
    };
    img.src = 'splash.png';
  }
  
  window.addEventListener('keypress', keyevent);
  drawsplash();
}
