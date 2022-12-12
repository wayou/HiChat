String.prototype.rep = function(find, replace) {
  return this.split(find).join(replace);
};
function fixss(input) {
  var inp = input;
  while (inp.indexOf('javascript:') != -1) {
    inp = inp.split('javascript:').join('');
  }
  inp = inp.rep('&', '&amp;').rep('<', '&lt;').rep('>', '&gt;').rep('"', '&quot');
  return inp;
}
window.onload = function() {
  var hichat = new HiChat();
  hichat.init();
};
var HiChat = function() {
  this.socket = null;
};
HiChat.prototype = {
  init: function() {
    var that = this;
    var ts = Date.now();
    this.socket = io.connect();
    this.socket.on('connect', function() {
      window.currentRoom = document.getElementById('chatRoom').value;
      document.getElementById('info').textContent = 'get yourself a nickname :)';
      document.getElementById('nickWrapper').style.display = 'block';
      document.getElementById('nicknameInput').focus();
    });
    this.socket.io.on('ping', function() {
      console.log('got ping packet in ' + Date.now() - ts + ' ms');
      ts = Date.now();
    });
    this.socket.on('nickExisted', function() {
      console.log('user ' + fixss(document.getElementById('nicknameInput').value) + ' already exists');
      document.getElementById('info').textContent = '!nickname is taken, choose another pls';
    });
    this.socket.on('loginSuccess', function() {
      var xssuser = fixss(document.getElementById('nicknameInput').value);
      console.log('logged in as ' + xssuser);
      document.title = 'hichat | ' + xssuser;
      document.getElementById('loginWrapper').style.display = 'none';
      document.getElementById('messageInput').focus();
      // that._displayNewMsg('system ', 'joined chat room ' + document.getElementById('chatRoom').value, 'red');
    });
    this.socket.on('error', function(err) {
      if (document.getElementById('loginWrapper').style.display == 'none') {
        document.getElementById('status').textContent = '!fail to connect :(';
      } else {
        document.getElementById('info').textContent = '!fail to connect :(';
      }
    });
    this.socket.on('system', function(nickName, userCount, type) {
      var logtype = (type == 'login' ? ' joined' : ' left');
      var msg = nickName + logtype;
      that._displayNewMsg('system ', msg, 'red');
      document.getElementById('status').textContent = userCount + (userCount > 1 ? ' users' : ' user') + ' online';
      console.log('got system message: ' + msg);
    });
    this.socket.on('newMsg', function(user, msg, color, room) {
      if (room == fixss(window.currentRoom)) {
        console.log('got message ' + msg + ' from user ' + user);
        that._displayNewMsg(user, msg, color);
      }
    });
    this.socket.on('newImg', function(user, img, color, room) {
      if (room == fixss(window.currentRoom)) {
        console.log('got image data of length ' + img.length + ' from user ' + user);
        that._displayImage(user, img, color);
      }
    });
    document.getElementById('loginBtn').addEventListener('click', function() {
      var nickName = document.getElementById('nicknameInput').value;
      if (nickName.trim().length != 0) {
        that.socket.emit('login', nickName, document.getElementById('chatRoom').value);
        console.log('logging in as ' + fixss(nickName));
      } else {
        console.log('login nickname is empty');
        document.getElementById('nicknameInput').focus();
      };
    }, false);
    document.getElementById('roomBtn').addEventListener('click', function() {
      window.currentRoom = document.getElementById('chatRoom').value;
      console.log('joined chat room ' + document.getElementById('chatRoom').value);
    }, false);
    document.getElementById('nicknameInput').addEventListener('keyup', function(e) {
      if (e.keyCode == 13) {
        var nickName = document.getElementById('nicknameInput').value;
        if (nickName.trim().length != 0) {
          console.log('logging in as ' + fixss(nickName));
          that.socket.emit('login', nickName);
        };
      };
    }, false);
    document.getElementById('sendBtn').addEventListener('click', function() {
      var messageInput = document.getElementById('messageInput'),
        msg = messageInput.value,
        color = document.getElementById('colorStyle').value;
      messageInput.value = '';
      messageInput.focus();
      if (msg.trim().length != 0) {
        that.socket.emit('postMsg', msg, color, window.currentRoom);
        that._displayNewMsg('me', fixss(msg), fixss(color));
        console.log('sent message ' + fixss(msg) + 'as user' + fixss(document.getElementById('nicknameInput').value));
        return;
      };
    }, false);
    document.getElementById('messageInput').addEventListener('keyup', function(e) {
      var messageInput = document.getElementById('messageInput'),
        msg = messageInput.value,
        color = document.getElementById('colorStyle').value;
      if (e.keyCode == 13 && msg.trim().length != 0) {
        messageInput.value = '';
        that.socket.emit('postMsg', msg, color, window.currentRoom);
        that._displayNewMsg('me', fixss(msg), fixss(color));
      };
    }, false);
    document.getElementById('clearBtn').addEventListener('click', function() {
      document.getElementById('historyMsg').innerHTML = '';
    }, false);
    document.getElementById('sendImage').addEventListener('change', function() {
      if (this.files.length != 0) {
        var file = this.files[0],
          reader = new FileReader(),
          color = document.getElementById('colorStyle').value;
        if (!reader) {
          that._displayNewMsg('system', '!your browser doesn\'t support fileReader', 'red');
          this.value = '';
          return;
        };
        reader.onload = function(e) {
          this.value = '';
          that.socket.emit('img', e.target.result, color, room);
          that._displayImage('me', fixss(e.target.result), fixss(color));
        };
        reader.readAsDataURL(file);
      };
    }, false);
    this._initialEmoji();
    document.getElementById('emoji').addEventListener('click', function(e) {
      var emojiwrapper = document.getElementById('emojiWrapper');
      emojiwrapper.style.display = 'block';
      e.stopPropagation();
    }, false);
    document.body.addEventListener('click', function(e) {
      var emojiwrapper = document.getElementById('emojiWrapper');
      if (e.target != emojiwrapper) {
        emojiwrapper.style.display = 'none';
      };
    });
    document.getElementById('emojiWrapper').addEventListener('click', function(e) {
      var target = e.target;
      if (target.nodeName.toLowerCase() == 'img') {
        var messageInput = document.getElementById('messageInput');
        messageInput.focus();
        messageInput.value = messageInput.value + '[emoji:' + target.title + ']';
      };
    }, false);
  },
  _initialEmoji: function() {
    var emojiContainer = document.getElementById('emojiWrapper'),
      docFragment = document.createDocumentFragment();
    for (var i = 69; i > 0; i--) {
      var emojiItem = document.createElement('img');
      emojiItem.src = '../content/emoji/' + i + '.gif';
      emojiItem.title = i;
      docFragment.appendChild(emojiItem);
    };
    emojiContainer.appendChild(docFragment);
  },
  _displayNewMsg: function(user, msg, color) {
    var container = document.getElementById('historyMsg'),
      msgToDisplay = document.createElement('p'),
      date = new Date().toTimeString().substr(0, 8),
      //determine whether the msg contains emoji
      msg = this._showEmoji(msg);
    msgToDisplay.style.color = color || '#000';
    msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span>' + msg;
    container.appendChild(msgToDisplay);
    container.scrollTop = container.scrollHeight;
  },
  _displayImage: function(user, imgData, color) {
    var container = document.getElementById('historyMsg'),
      msgToDisplay = document.createElement('p'),
      date = new Date().toTimeString().substr(0, 8);
    msgToDisplay.style.color = color || '#000';
    msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span> <br/>' + '<a href="' + imgData + '" target="_blank"><img src="' + imgData + '"/></a>';
    container.appendChild(msgToDisplay);
    container.scrollTop = container.scrollHeight;
  },
  _showEmoji: function(msg) {
    var match, result = msg,
      reg = /\[emoji:\d+\]/g,
      emojiIndex,
      totalEmojiNum = document.getElementById('emojiWrapper').children.length;
    while (match = reg.exec(msg)) {
      emojiIndex = match[0].slice(7, -1);
      if (emojiIndex > totalEmojiNum) {
        result = result.replace(match[0], '[X]');
      } else {
        result = result.replace(match[0], '<img class="emoji" src="../content/emoji/' + emojiIndex + '.gif" />');//todo:fix this in chrome it will cause a new request for the image
      };
    };
    return result;
  },
};
