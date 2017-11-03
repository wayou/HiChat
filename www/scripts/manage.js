var nickName
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
            var d = new Date();
            nickName = d.getTime();
            that.socket.emit('login', 'bot' + nickName);
        });
        this.socket.on('list', function(users, ip) {
            console.log(users);
            //console.log(ip);
            var container = document.getElementById('users');
            container.innerHTML = '';
            for(i=0;i<=users.length-1;i++) {
                container.innerHTML += '<button onclick="document.getElementById(\'idInput\').value = this.innerHTML;">' + users[i] +'</button>';
            }
            document.getElementById('ip').innerHTML = ''
            for(i=0;i<=ip.length-1;i++) {
                document.getElementById('ip').innerHTML += '<li>' + ip[i] + '</li>';
            }
        });
        document.getElementById('killBtn').addEventListener('click', function() {
            var id = document.getElementById('idInput').value;
            that.socket.emit('kill', id);
            document.getElementById('idInput').value = '';
        }, false);
    }
};