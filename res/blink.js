(function() {

  BlinkPre= {};

  // Comms stuff

  var ws = location.href.replace("http", "ws");
  if (!/\/\d+$/.test(ws)) {
    ws += '/' + id;
  }

  function msg(t, m) {
    var msg = (m === undefined) ?
      { type: t.type, data: t } :
      { type: t, data: m }
    BlinkPre.sock.send(JSON.stringify(msg))
  }


  function connect() {
    BlinkPre.sock = new WebSocket(ws);
    BlinkPre.sock.onmessage = onmessage;
    BlinkPre.sock.onclose = function() {
      if (BlinkPre.sock.readyState == 3) {
        setTimeout(connect, 500);
      }
    }
  }

  function onmessage(event) {
    var msg = JSON.parse(event.data);
    if (handlers.hasOwnProperty(msg.type)) {
      handlers[msg.type](msg);
    }
  };

  function cb(id, data) {
    data === undefined && (data = null);
    Promise.resolve(data).then(data => {
      var err = data != null ? data.type == 'error' : false;
      msg('callback', {callback: id, result: data, error: err});
    });
  }


  var handlers = {};
  handlers.eval = function(data) {
    new Promise(resolve => resolve(eval(data.code)))
      .catch(e => {
        return ({type: 'error', name: e.name, message: e.message})
      })
      .then(result => {
        if (data.callback) {
          cb(data.callback, result);
        }
      });
  }

  BlinkPre.msg = msg;
  BlinkPre.cb = cb;
  BlinkPre.handlers = handlers;
  connect();

  // JS eval

  function innertext(dom) {
    var children = dom.childNodes;
    if (children.length > 0) {
      return children[0].wholeText;
    } else {
      return "";
    }
  }

  function evalwith(obj, code) {
    return (function() {
      return eval(code);
    }).call(obj);
  }

  function evalscripts(dom) {
    var scripts = dom.querySelectorAll("script");
    Array.prototype.forEach.call(scripts, function(s) {
      window.eval(innertext(s));
    });
  }

  BlinkPre.evalwith = evalwith;
  BlinkPre.evalscripts = evalscripts;

  // HTML utils

  function callback(t, f) {
    if (f === undefined) {
      f = t;
      t = 0;
    }
    t *= 1000;
    setTimeout(f, t);
  }

  function select(node) {
    if (typeof node === "string") {
      return document.querySelector(node);
    } else {
      return node;
    }
  }

  function fill(node, html, fade, resolve, reject) {
    node = select(node);
    fade ?
      fillfade(node, html, resolve, reject) :
      fillnofade(node, html, resolve, reject)
  }
  function fillfade(node, html, resolve, reject) {
    node = select(node);
    node.classList.add('blink-show');
    callback(function () {
      node.classList.add('blink-fade');
      callback(0.2, function() {
        fillnofade(node, html, null, null);
        node.classList.remove('blink-fade');
        if (resolve) resolve(true);
      });
    });
  }
  function fillnofade(node, html, resolve, reject) {
    node.innerHTML = html;
    evalscripts(node);
    if (resolve) resolve(true);
  }

  BlinkPre.fill = fill;

  // JS Utils

  function hypot(x, y) {
    return Math.sqrt(x*x + y*y);
  }

  function click(node, f) {
    var startX = 0;
    var startY = 0;
    node.onmousedown = function(e) {
      if (e.which == 1) {
        startX = e.clientX;
        startY = e.clientY;
      }
    };
    node.onmouseup = function(e) {
      if (e.which == 1 && hypot(e.clientX - startX, e.clientY - startY) < 5) {
        f(e);
      }
    };
  }

  BlinkPre.click = click;

  // Window creation callback: Mark this window as done loading.
  if (typeof callback_id !== 'undefined') {
    BlinkPre.sock.onopen = ()=>{ cb(callback_id, true); }
  }
})();
