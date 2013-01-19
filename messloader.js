var Module = null;
var requests = [];
var file_countdown = 1;

var newCanvas = document.createElement('canvas');
newCanvas.id = 'canvas';
newCanvas.width = 512;
newCanvas.height = 384;
var holder = document.getElementById('canvasholder');
holder.appendChild(newCanvas);

var draw_loading_status = function() {
  var font_height = 18;
  var line_height = newCanvas.height - (font_height * 2);
  var context = newCanvas.getContext('2d');
  var progress = 0;
  context.clearRect(0, 0, newCanvas.width, newCanvas.height);
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
  context.fillRect(0, y, newCanvas.width, line_height);
  context.fillStyle = 'Green';
  context.fillRect(0, y, newCanvas.width * progress, line_height);
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

var init_module = function(json) {
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
  
  modulecfg = JSON.parse(json);
  
  var gamename = 'smurfs.zip';
  var game_file = null;
  var bios_filenames = modulecfg['bios_filenames'];
  var bios_files = {};
  if (bios_filenames.length !== 0 && bios_filenames[0] !== '') {
    file_countdown += bios_filenames.length;
  }
  if (gamename !== '') {
    file_countdown++;
  }
  
  var nr = modulecfg['native_resolution'];
  
  Module = {
    'arguments': [modulecfg['driver'],'-verbose','-rompath','.','-' + modulecfg['peripherals'][0],gamename,'-window','-resolution',nr[0]+'x' + nr[1],'-nokeepaspect'].concat(modulecfg['extra_args']),
    print: (function() {
      var element = document.getElementById('output');
      return function(text) {
        text = text.replace(/&/g, '&amp;');
        text = text.replace(/</g, '&lt;');
        text = text.replace(/>/g, '&gt;');
        text = text.replace('\n', '<br>', 'g');
        element.innerHTML += text + '<br>';
      };
    })(),
    canvas: document.getElementById('canvas'),
    noInitialRun: false,
    preInit: function() {
      // Load the downloaded binary files into the filesystem.
      for (var bios_fname in bios_files) {
        if (bios_files.hasOwnProperty(bios_fname)) {
          Module['FS_createDataFile']('/', bios_fname, bios_files[bios_fname], true, true);
        }
      }
      Module['FS_createDataFile']('/', gamename, game_file, true, true);
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

  if (gamename !== '') {
    fetch_file('Game', gamename, function(data) { game_file = data; update_countdown(); });
  }

  fetch_file('Javascript', modulecfg['js_filename'], function(data) { js_data = data; update_countdown(); }, 'text', true);

  draw_loading_status();
};

fetch_file('Javascript', 'module.json', function(data) { init_module(data) }, 'text', true, true);
