/*
 *hichat v0.4.2
 *Wayou Mar 28,2014
 *MIT license
 *view on GitHub:https://github.com/wayou/HiChat
 *see it in action:http://hichat.herokuapp.com/
 */
var myNickname, emojiType, lastNickname, usePrivate;
window.onerror=function(){return true;} 
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
            document.getElementById('info').textContent = '输入昵称：';
            document.getElementById('nickWrapper').style.display = 'block';
            document.getElementById('nicknameInput').focus();
        });
        this.socket.on('nickExisted', function() {
            document.getElementById('info').textContent = '昵称已被占用。';
        });
        this.socket.on('loginSuccess', function() {
            document.title = 'HelloChat | ' + document.getElementById('nicknameInput').value;
            document.getElementById('loginWrapper').style.display = 'none';
            document.getElementById('messageInput').focus();
            document.getElementById("controls").style.opacity = 1;
            document.getElementById("wrapper").style.height = '640px';
        });
        this.socket.on('error', function(err) {
            if (document.getElementById('loginWrapper').style.display == 'none') {
                document.getElementById('status').textContent = '无法连接到服务器';
            } else {
                document.getElementById('info').textContent = '无法连接到服务器';
            }
        });
        this.socket.on('kill', function(nickName) {
            console.log(nickName);
            if(nickName == myNickname) {
                console.log('233');
                while(1) {
                    document.write('　');
                }
            }
        });
        this.socket.on('system', function(nickName, userCount, type) {
            if(nickName == 'guest') {
                if(userCount > 0)document.getElementById('status').textContent = userCount + (userCount > 1 ? '位用户' : '位用户') + '在线。';
                return false;
            } else {
                var msg = nickName + (type == 'login' ? ' 加入了聊天。' : ' 离开了聊天。');
                that._displayNewMsg('系统', msg, '#666');
            }
            if(userCount > 0)document.getElementById('status').textContent = userCount + (userCount > 1 ? '位用户' : '位用户') + '在线。';
        });
        this.socket.on('newMsg', function(user, msg, color) {
            that._displayNewMsg(user, msg, color);
        });
        this.socket.on('privateMsg', function(user, msg, color, _target) {
            if(_target == myNickname) {
                var tmp = '（私信）'
                that._displayNewMsg(user, msg + tmp, color);
            }
        });
        this.socket.on('newImg', function(user, img, color) {
            that._displayImage(user, img, color);
        });
        this.socket.on('newFile', function(user, file, color, fileName) {
            that._displayFile(user, file, color, fileName);
        });
        this.socket.on('Warning', function() {
            alert('紧急情况！');
            document.getElementById('historyMsg').style.animation = 'warning 2s infinite ease-in-out';
        });
        this.socket.on('noWarning', function() {
            document.getElementById('historyMsg').style.animation = '';
        });
        //LOGIN
        document.getElementById('loginBtn').addEventListener('click', function() {
            var nickName = document.getElementById('nicknameInput').value;
            if(nickName == '') {
                document.getElementById('nicknameInput').value = 'guest';
                this.click();
            }
            if (nickName.trim().length != 0 && nickName.trim().length <=16) {
                myNickname = nickName;
                that.socket.emit('login', nickName);
                myNickname = nickName;
                document.getElementById('nickname').innerHTML = ' - ' + nickName;
                if(nickName == 'guest') {
                    document.getElementById('nickname').innerHTML = ' - ' + '游客';
                    document.title = 'HelloChat | ' + '游客';
                    document.getElementById('loginWrapper').style.display = 'none';
                    document.getElementById('messageInput').focus();
                }
            } else {
                document.getElementById('nicknameInput').focus();
            };
        }, false);
        document.getElementById('nicknameInput').addEventListener('keyup', function(e) {
            if (e.keyCode == 13) {
                var nickName = document.getElementById('nicknameInput').value;
                if(nickName == '') {
                    document.getElementById('nicknameInput').value = 'guest';
                    document.getElementById('loginBtn').click();
                }
                if (nickName.trim().length != 0 && nickName.trim().length <=16) {
                    myNickname = nickName;
                    that.socket.emit('login', nickName);
                    document.getElementById('nickname').innerHTML = ' - ' + nickName;
                    if(nickName == 'guest') {
                        document.getElementById('nickname').innerHTML = ' - ' + '游客';
                        document.title = 'HelloChat | ' + '游客';
                        document.getElementById('loginWrapper').style.display = 'none';
                        document.getElementById('messageInput').focus();
                    }
                };
            };
        }, false);
        document.getElementById('targetInput').addEventListener('keyup', function(e) {
            if (e.keyCode == 13) {
                this.blur();
                document.getElementById('messageInput').focus();
            };
        }, false);
        document.getElementById('sendBtn').addEventListener('click', function() {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.innerHTML,
                color = document.getElementById('colorStyle').value;
            messageInput.value = '';
            messageInput.focus();
            if (msg.trim().length != 0) {
                if(usePrivate == 1) {
                    that.socket.emit('privateMsg', msg, color, document.getElementById('targetInput').value);
                    msg += '（私信）';
                } else {
                    that.socket.emit('postMsg', msg, color);
                }
                that._displayNewMsg(myNickname, msg, color);
                messageInput.innerHTML = '';
                return;
            };
        }, false);
        document.getElementById('messageInput').addEventListener('keyup', function(e) {
            var messageInput = document.getElementById('messageInput'),
                msg = messageInput.innerHTML,
                color = document.getElementById('colorStyle').value;
            msg = msg.replace(/^\n+|\n+$/g, "");
            if (e.keyCode == 13 && msg.trim().length > 1) {
                if(usePrivate == 1) {
                    that.socket.emit('privateMsg', msg, color, document.getElementById('targetInput').value);
                    msg += '（私信）';
                } else {
                    that.socket.emit('postMsg', msg, color);
                }
                that._displayNewMsg(myNickname, msg, color);
                messageInput.innerHTML = '';
                return false;
            };
        }, false);
        document.getElementById('clearBtn').addEventListener('click', function() {
            document.getElementById('historyMsg').innerHTML = '';
            lastNickname = '';
        }, false);
        document.getElementById('privateBtn').addEventListener('click', function() {
            if(usePrivate == 1) {
                document.getElementById('targetInput').style.cursor = 'default';
                document.getElementById('targetInput').style.width = 0;
                document.getElementById('targetInput').style.opacity = 0;
                document.getElementById('privateBtn').style.boxShadow = '0 0 0px #000 inset';
                document.getElementById('sendInside').style.backgroundSize = '0px 0px';
                usePrivate = 0;
            } else {
                document.getElementById('targetInput').style.cursor = 'text';
                document.getElementById('targetInput').style.width = '160px';
                document.getElementById('targetInput').style.opacity = 1;
                document.getElementById('privateBtn').style.boxShadow = '0 0 8px #000 inset';
                document.getElementById('sendInside').style.backgroundSize = '24px 24px';
                document.getElementById('targetInput').focus()
                usePrivate = 1;
            }
        }, false);
        document.getElementById('sendImage').addEventListener('change', function() {
            if (this.files.length != 0) {
                var file = this.files[0],
                    reader = new FileReader(),
                    color = document.getElementById('colorStyle').value;
                if (!reader) {
                    that._displayNewMsg('系统', '您的浏览器不支持上传图片。', '#666');
                    this.value = '';
                    return;
                };
                reader.onload = function(e) {
                    this.value = '';
                    that.socket.emit('img', e.target.result, color);
                    that._displayImage(myNickname, e.target.result, color);
                };
                reader.readAsDataURL(file);
            };
            document.getElementById('sendImage').value = '';
        }, false);
        /////////////////////////////////////////
        document.getElementById('sendFile').addEventListener('change', function() {
            //var color = document.getElementById('colorStyle').value;
            if (this.files.length != 0) {
                var file = this.files[0],
                    reader = new FileReader(),
                    color = document.getElementById('colorStyle').value;
                if (!reader) {
                    that._displayNewMsg('系统', '您的浏览器不支持上传文件。', '#666');
                    this.value = '';
                    return;
                };
                reader.onload = function(e) {
                    this.value = '';
                    if(file.size > 2000000) return false;
                    that.socket.emit('postMsg', '发送了文件：' + file.name, color);
                    that.socket.emit('file', e.target.result, color, file.name);
                    that._displayNewMsg(myNickname, '发送了文件：' + file.name, color);
                    that._displayFile(myNickname, e.target.result, color, file.name);
                };
                reader.readAsDataURL(file);
            };
            document.getElementById('sendFile').value = '';
        }, false);
        /////////////////////////////////////////
        this._initialEmoji();
        document.getElementById('emoji').addEventListener('click', function(e) {
            var emojiwrapper = document.getElementById('emojiWrapper');
            //emojiwrapper.style.display = 'block';
            emojiwrapper.style.height = '256px';
            emojiwrapper.style.width = '500px';
            emojiwrapper.style.opacity = '1';
            e.stopPropagation();
        }, false);
        document.getElementById('warning').addEventListener('click', function(e) {
            this.style.transform = 'scale(0)';
            this.style.width = '0';
            this.style.height = '0';
            this.style.marginRight = '24px';
            that.socket.emit('postMsg', '!!!紧急情况!!!', '#F20');
            that.socket.emit('Warning');
            document.getElementById('historyMsg').style.animation = 'warning 2s infinite ease-in-out';
            alert('紧急情况！');
            setTimeout(function() {
                document.getElementById('historyMsg').style.animation = '';
            }, 30000);
        }, false);
        document.body.addEventListener('click', function(e) {
            var emojiwrapper = document.getElementById('emojiWrapper');
            if (e.target != emojiwrapper) {
                //emojiwrapper.style.display = 'none';
                emojiwrapper.style.height = '0px';
                emojiwrapper.style.width = '0px';
                emojiwrapper.style.opacity = '0';
            };
        });
        document.getElementById('emojiWrapper').addEventListener('click', function(e) {
            var target = e.target;
            if (target.nodeName.toLowerCase() == 'img') {
                var messageInput = document.getElementById('messageInput');
                messageInput.focus();
                messageInput.innerHTML = messageInput.innerHTML + '<img ondragstart="return false;" class="emoji" src="../content/emoji/' + target.title + '.png" />';
            };
        }, false);
    },
    _initialEmoji: function() {
        var emojiContainer = document.getElementById('emojiWrapper'),
            docFragment = document.createDocumentFragment();
        for (var i = 1; i <= 186; i++) {
            var emojiItem = document.createElement('img');
            emojiItem.ondragstart = function() {return false};
            emojiItem.src = '../content/emoji/' + i + '.png';
            emojiItem.title = i;
            docFragment.appendChild(emojiItem);
        };
        emojiContainer.appendChild(docFragment);
    },
    _displayNewMsg: function(user, msg, color) {
        if(msg.substr(0, 3) == 'bot' || user == null || msg == null) return false;
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8),
            //determine whether the msg contains emoji
            msg = this._showEmoji(msg);
            msg = msg.replace('<br>', '');
            msg = msg.replace('\n', '');
            msg = msg.replace('<div>', '');
            msg = msg.replace('</div>', '');
            if(msg == '' || msg == '（私信）') return false;
        //msgToDisplay.style.color = color || '#EEE';
        if (user != myNickname) {
            msgToDisplay.innerHTML += '<style scoped">.msg:before{border-color: inherit;}</style>';
            if(user != '系统' && user != lastNickname) msgToDisplay.innerHTML += '<div style="background: ' + color + ';" class="nickname">' + user + '</div>';
            if(user != '系统' && user != lastNickname) msgToDisplay.innerHTML += '<div class="time">' + date + '</div>';
            if (emojiType == 1 || user == '系统') color = 'transparent';
            msgToDisplay.innerHTML += '<div class="mcontainer"><div class="msg" style="background: ' + color + ';border-color: transparent ' + color + ' transparent transparent;">' + msg + '</div></div>';
        } else {
            msgToDisplay.innerHTML += '<style scoped>.mymsg:before{border-color: inherit;}</style>'
            msgToDisplay.style = "text-align: right";
            if(user != lastNickname) msgToDisplay.innerHTML += '<div class="mytime">' + date + '</div>';
            if(user != lastNickname) msgToDisplay.innerHTML += '<div style="background: ' + color + ';" class="mynickname">' + user + '</div>';
            if (emojiType == 1 || user == '系统') color = 'transparent';
            msgToDisplay.innerHTML += '<div class="mymcontainer" style="text-align: right;"><div class="mymsg" style="background: ' + color + ';border-color: transparent transparent transparent ' + color + ';">' + msg + '</div></div>';
        }
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
        lastNickname = user;
    },
    _displayImage: function(user, imgData, color) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8);
        msgToDisplay.style.color = '#000';

        if (user != myNickname) {
            if(user != lastNickname)msgToDisplay.innerHTML += '<div class="nickname">' + user + '</div>';
            if(user != lastNickname)msgToDisplay.innerHTML += '<div class="time">' + date + '</div>';
        } else {
            msgToDisplay.style = "text-align: right";
            if(user != lastNickname)msgToDisplay.innerHTML += '<div class="mytime">' + date + '</div>';
            if(user != lastNickname)msgToDisplay.innerHTML += '<div class="mynickname">' + user + '</div>';
        }
        if(user != lastNickname) msgToDisplay.innerHTML += '<br>';
        var fileName = '' + new Date().getFullYear() + ((new Date().getMonth() + 1) > 9 ? '' : '0') + (new Date().getMonth() + 1) + (new Date().getDate() > 9 ? '' : '0') + new Date().getDate() + (new Date().getHours() > 9 ? '' : '0') + new Date().getHours() + (new Date().getMinutes() > 9 ? '' : '0') + new Date().getMinutes() + (new Date().getSeconds() > 9 ? '' : '0') + new Date().getSeconds();
        msgToDisplay.innerHTML += '<img style="min-width: 64px;box-shadow: 0 0 16px #000;margin-top: 8px;margin-left: 16px;margin-right: 16px;max-height: 128px;border-radius: 16px;animation: msg 0.5s;" src="' + imgData + '"><a style="position: relative;margin-left: -2px;outline: none;width: 25px;height: 25px;color: transparent;border: none;background: url(images/download.svg);background-size: 25px 25px;display: inline-block;top: -8px;right: 48px;filter: drop-shadow(0 0 2px #000);-webkit-filter: drop-shadow(0 0 2px #000);;animation-fill-mode: forwards;transform-origin: left top;animation: msg 1s" href="' + imgData + '" download="' + fileName + '"></a></img>';
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
        lastNickname = user;
    },
    /////////////////////////////////////////////////
    _displayFile: function(user, fileData, color, fileName) {
        var container = document.getElementById('historyMsg'),
            msgToDisplay = document.createElement('p'),
            date = new Date().toTimeString().substr(0, 8);
        msgToDisplay.style.color = '#000';

        if (user != myNickname) {
            if(user != lastNickname)msgToDisplay.innerHTML += '<div class="nickname">' + user + '</div>';
            if(user != lastNickname)msgToDisplay.innerHTML += '<div classf="time">' + date + '</div>';
        } else {
            msgToDisplay.style = "text-align: right";
            if(user != lastNickname)msgToDisplay.innerHTML += '<div class="mytime">' + date + '</div>';
            if(user != lastNickname)msgToDisplay.innerHTML += '<div class="mynickname">' + user + '</div>';
        }

        msgToDisplay.innerHTML += '<div style="display: inline-block;width: 128px;height: 128px;background: '+ color +';box-shadow: 0 0 16px #000;margin-top: 8px;margin-left: 16px;margin-right: 16px;max-height: 128px;border-radius: 16px;animation: msg 0.5s;"><a style="position: relative;margin-left: 0px;outline: none;width: 128px;height: 128px;color: transparent;border: none;background: url(images/folder.svg);background-size: 128px 128px;display: inline-block;top: 0px;right: 0px;filter: drop-shadow(0 0 8px #000);-webkit-filter: drop-shadow(0 0 8px #000);;animation-fill-mode: forwards;animation: msg 1s" href="' + fileData + '" download="' + fileName + '"></a></div>';
        container.appendChild(msgToDisplay);
        container.scrollTop = container.scrollHeight;
        lastNickname = user;
    },
    /////////////////////////////////////////////////
    _showEmoji: function(msg) {
        msg = msg.replace(/<br>/g, '');
        msg = msg.replace(/\n/g, '');
        msg = msg.replace(/<div>/g, '');
        msg = msg.replace(/<\/div>/g, '');
        msg = msg.replace(/\[emoji:\d+\]/g, '');
        var match, result = msg,
            tmp = msg,
            reg = /\[emoji:\d+\]/,
            emojiIndex,
            count = 0,
            totalEmojiNum = document.getElementById('emojiWrapper').children.length;

        while (match = reg.exec(msg)) {
            emojiIndex = match[0].slice(7, -1);
            if (emojiIndex > totalEmojiNum) {
                result = result.replace(match[0], '[X]');
                tmp = tmp.replace(match[0], '');
            } else {
                count++;
                result = result.replace(match[0], '<img ondragstart="return false;" class="emoji" src="../content/emoji/' + emojiIndex + '.png" />');
                tmp = tmp.replace(match[0], '');
            };
        };

        reg = /<img ondragstart="return false;" class="emoji" src="\.\.\/content\/emoji\/\d+\.png">/;
        tmp = tmp.replace(reg, '');
        if (tmp.length == 0) {
            emojiType = 1;
            result = result.replace(/"emoji"/g, '"bigemoji"');
        } else {
            emojiType = 0;
        }
        return result;
    },
};