var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    loginCount = [],
    able = [],
    ip = [],
    fullip = new Array(),
    users = [];
//specify the html we will use
app.use('/', express.static(__dirname + '/www'));
//bind the server to the 80 port
//server.listen(3000);//for local test
server.listen(process.env.PORT || 3000);//publish to heroku
//server.listen(process.env.OPENSHIFT_NODEJS_PORT || 3000);//publish to openshift
//console.log('server started on port'+process.env.PORT || 3000);
//handle the socket
io.sockets.on('connection', function(socket) {
    //new user login
    socket.on('login', function(nickname) {
        console.log(users);
        var len = socket.handshake.address.address.length;
        var ad = '' + socket.handshake.address.address[len-2] + socket.handshake.address.address[len-1];
        //console.log(ad);
        ip[nickname] = ad;
        fullip.push(nickname + '|' + socket.handshake.address.address);
        if(isNaN(loginCount[ad])) {
            loginCount[ad] = 1;
            able[ad] = 1;
            //console.log('NEW');
        } else {
            loginCount[ad] += 1;
        }
        if(loginCount[ad] > 8) {
            setTimeout(function() {
                //socket.broadcast.emit('kill', nickname);
            }, 2000);
        }
        //console.log(nickname);
        //console.log(loginCount[ad]);
        //console.log(able[ad]);
        if(able[ad] != 1) {
            setTimeout(function() {
                socket.broadcast.emit('kill', nickname);
            }, 2000);
        }
        if (users.indexOf(nickname) > -1 || nickname == '系统' || nickname == null || nickname.length > 16 || nickname.length == 0 || able[ad] != 1) {
            socket.emit('nickExisted');
            return ;
        } else {
            //socket.userIndex = users.length;
            if(nickname != 'guest' && nickname.substr(0, 3) != 'bot') {
                socket.nickname = nickname;
                users.push(nickname);
                socket.emit('loginSuccess');
            }
            console.log(fullip);
            socket.broadcast.emit('list', users, fullip);
            io.sockets.emit('system', nickname, users.length, 'login');
        };
    });
    //user leaves
    socket.on('disconnect', function() {
        //users.splice(socket.userIndex, 1);
        if(socket.nickname != 'guest' && socket.nickname != null) {
            users.splice(users.indexOf(socket.nickname), 1);
            socket.broadcast.emit('list', users, fullip);
            socket.broadcast.emit('system', socket.nickname, users.length, 'logout');
        }
    });
    //new message get
    socket.on('postMsg', function(msg, color) {
        if(socket.nickname == null) return false;
        if(msg.length <= 2048) {
            socket.broadcast.emit('newMsg', socket.nickname, msg, color);
        } else {
            socket.broadcast.emit('newMsg', socket.nickname, '我可能是个智障', color);
        }
    });
    //private message get
    socket.on('privateMsg', function(msg, color, _target) {
        if(socket.nickname == null) return false;
            socket.broadcast.emit('privateMsg', socket.nickname, msg, color, _target);
    });
    //new image get
    socket.on('img', function(imgData, color) {
        if(socket.nickname == null) return false;
        socket.broadcast.emit('newImg', socket.nickname, imgData, color);
    });
    //new file get
    socket.on('file', function(fileData, color, fileName) {
        if(socket.nickname == null) return false;
        socket.broadcast.emit('newFile', socket.nickname, fileData, color, fileName);
    });
    var warning = 0;
    //Warning
    socket.on('Warning', function() {
        if(socket.nickname == null) return false;
        if(warning == 0) {
            warning = 1;
            socket.broadcast.emit('Warning');
            var oneSecond = 1000 * 1;
            setTimeout(function() {
                socket.broadcast.emit('noWarning');
                warning = 0;
            }, 30000);
        }
    });
    socket.on('crash', function() {
        socket.broadcast.emit('crash');
    });
    socket.on('kill', function(nickName) {
        socket.broadcast.emit('kill', nickName);
        able[ip[nickName]] = 0;
        //console.log('able:' + ip[nickName]);
    });
});
