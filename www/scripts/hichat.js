/*
 *hichat v0.4.2
 *Wayou Mar 28,2014
 *MIT license
 *view on GitHub:https://github.com/wayou/HiChat
 *see it in action:http://hichat.herokuapp.com/
 */
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
        this.socket = io.connect();
        this.socket.on('connect', function() {
            document.getElementById('info').textContent = 'get yourself a nickname :)';
            document.getElementById('nickWrapper').style.display = 'block';
            document.getElementById('nicknameInput').focus();
        });
        this.socket.on('nickExisted', function() {
            document.getElementById('info').textContent = '!nickname is taken, choose another pls';
        });
        this.socket.on('loginSuccess', function() {
            document.title = 'hichat | ' + document.getElementById('nicknameInput').value;
            document.getElementById('loginWrapper').style.display = 'none';
            document.getElementById('messageInput').focus();
        });
        this.socket.on('error', function(err) {
            if (document.getElementById('loginWrapper').style.display == 'none') {
                document.getElementById('status').textContent = '!fail to connect :(';
            } else {
                document.getElementById('info').textContent = '!fail to connect :(';
            }
        });
        this.socket.on('system', function(nickName, userCount, type) {
            var msg = nickName + (type == 'login' ? ' joined' : ' left');
            that._displayNewMsg('system ', msg, 'red');
            document.getElementById('status').textContent = userCount + (userCount > 1 ? ' users' : ' user') + ' online';
        });
        this.socket.on('newMsg', function(user, msg, color) {
            that._displayNewMsg(user, msg, color);
        });
        this.socket.on('newImg', function(user, img, color) {
            that._displayImage(user, img, color);
        });
        document.getElementById('loginBtn').addEventListener('click', function() {
            var nickName = document.getElementById('nicknameInput').value;
            if (nickName.trim().length != 0) {
                testXSSattemtp(nickName);
                that.socket.emit('login', nickName);
            } else {
                document.getElementById('nicknameInput').focus();
            };
        }, false);
        document.getElementById('nicknameInput').addEventListener('keyup', function(e) {
            if (e.keyCode == 13) {
                var nickName = document.getElementById('nicknameInput').value;
                if (nickName.trim().length != 0) {
                    testXSSattemtp(nickName);
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
                testXSSattemtp(msg)
                that.socket.emit('postMsg', msg, color);
                that._displayNewMsg('me', msg, color);
                return;
            };
        }, false);
        document.getElementById('messageInput').addEventListener('keyup', function(e) {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.value,
                color = document.getElementById('colorStyle').value;
            if (e.keyCode == 13 && msg.trim().length != 0) {
                messageInput.value = '';
                testXSSattemtp(msg);
                that.socket.emit('postMsg', msg, color);
                that._displayNewMsg('me', msg, color);
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
                    that.socket.emit('img', e.target.result, color);
                    that._displayImage('me', e.target.result, color);
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
        user = DOMPurify.sanitize(user, {SAFE_FOR_JQUERY: true});
//        msg = DOMPurify.sanitize(msg, {SAFE_FOR_JQUERY: true});
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8),
            //determine whether the msg contains emoji
            msg = this._safeShowEmoji(msg);
        msgToDisplay.style.color = color || '#000';
        msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span>';
        for (var i = 0; i<msg.length; i++){
            msgToDisplay.appendChild(msg[i]);
        }
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },
    _displayImage: function(user, imgData, color) {
//        imgData = DOMPurify.sanitize(imgData)
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8);
        msgToDisplay.style.color = color || '#000';
        var linkEl = document.createElement('a')
        linkEl.href = this._noJSLink(imgData);
        linkEl.target = '_blank';
        var imgEl = document.createElement('img')
        imgEl.src = imgData;
        linkEl.appendChild(imgEl)
        msgToDisplay.innerHTML = user + '<span class="timespan">(' + date + '): </span> <br/>'
        msgToDisplay.appendChild(linkEl)

        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
    },
    _safeShowEmoji: function(msg) {
        var match, result = new Array(),
            reg = /\[emoji:\d+\]/g,
            emojiIndex, newEl, prevLastIndex=0,
            totalEmojiNum = document.getElementById('emojiWrapper').children.length;
        while (match = reg.exec(msg)) {

            if(match.index>prevLastIndex){ // Content exist before emoji
                newEl = document.createElement('span');
                newEl.textContent = msg.substring(prevLastIndex, match.index);
                result.push(newEl);
            }

            emojiIndex = match[0].slice(7, -1);
            if (emojiIndex > totalEmojiNum) {
                newEl = document.createElement('span');
                newEl.textContent = '[X]';
                result.push(newEl);
            } else {
                newEl = document.createElement('img');
                newEl.src = '../content/emoji/' + emojiIndex + '.gif'; //todo:fix this in chrome it will cause a new request for the image ... Not sure it still happens
                newEl.className = "emoji"
                result.push(newEl);
            };
            prevLastIndex = reg.lastIndex;
        };
        if(reg.lastIndex<msg.length){ // Content exist after emojis
            newEl = document.createElement('span');
            newEl.textContent = msg.substring(prevLastIndex);
            result.push(newEl);
        }

        return result;
    },
    _noJSLink: function(text){
        var reg = /javascript\s*:\s*/
        text = text.replace("/\s+/", "");
        while (match = reg.exec(text)) {
            text = text.replace(match[0], '');
            reg.lastIndex=0;
        }
        return text;
    }
};

const showXSSMsg = false;
function testXSSattemtp(txt){
    if(txt.match(/<.*on[^\s]+[\s]*(=|&#61;|&equals;)[\s]*("|').+("|').*>/gi)){
        if(showXSSMsg)alert('Please avoid attempting code execution');
        return true;
    }
    return false;
}
