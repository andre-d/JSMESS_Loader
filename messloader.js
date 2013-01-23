var Module = null;

function JSMESS(canvas, module, output, game, callback) {
  var js_data;
  var moduledata;
  var requests = [];
  var file_countdown  = 1;

  this.setcallback = function(_callback) {
    callback = _callback;
    return this;
  }

  this.setmodule = function(_module) {
    module = _module;
    return this;
  }

  this.setgame = function(_game) {
    game = _game;
    return this;
  }

  var draw_loading_status = function() {
    var font_height = 18;
    var line_height = (font_height * 2);
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = font_height + 'px sans-serif';
    context.fillStyle = 'Black';
    context.fillText('Loading...', 0, font_height);
    
    for(var i = 0; i < requests.length; i++) {
      var o = requests[i];
      var str = " ";
      
      if(o.title == 'Javascript' || !o.lengthComputable) {
        str += "-";
      } else if(o.progress >= 1.0) {
        str += "\u221A";
      } else {
        str += "x";
      }
     
      var y = (line_height) + font_height + (i * line_height);
      
      context.fillText(str, 0, y);

      str = o.title;
      str += " " + o.loaded;
      if(o.title != 'Javascript' && o.lengthComputable) {
        str += "/" + o.total;
      }
      str += "bytes";
      
      context.fillText(str, 35, y);
    }  
  };

  var progress_fetch_file = function(e) {
    if(e.lengthComputable) {
      e.target.progress = e.loaded / e.total;
      e.target.loaded = e.loaded;
      e.target.total = e.total;
      e.target.lengthComputable = e.lengthComputable;
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
      xhr.total = 0;
      xhr.loaded = 0;
      xhr.lengthComputable = false;
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
    var modulecfg = JSON.parse(moduledata);
    
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
      'arguments': [modulecfg['driver'],'-verbose','-rompath','.','-' + modulecfg['peripherals'][0],game.replace(/\//g,'_'),'-window','-resolution',nr[0]+'x' + nr[1],'-nokeepaspect'].concat(modulecfg['extra_args']),
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
        Module['FS_createDataFile']('/', game.replace(/\//g,'_'), game_file, true, true);
        if(callback) {
          modulecfg.canvas = canvas;
          window.setTimeout(function() {callback(modulecfg)}, 0);
        }
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
      fetch_file('Game', game, function(data) { game_file = data; update_countdown(); });
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
    var context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    var img = new Image();
    img.onload = function(){
      context.drawImage(img, canvas.width / 2 - (img.width / 2), canvas.height / 2 - (img.height / 2));
      context.font = '18px sans-serif';
      context.fillStyle = 'Black';
      context.textAlign = 'center';
      context.fillText('press space', canvas.width / 2, (canvas.height / 2) + (img.height / 2));
      context.textAlign = 'start';
    };
    img.src = 'splash.png';
  }
  
  window.addEventListener('keypress', keyevent);
  drawsplash();
}
