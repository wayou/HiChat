var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    { Server } = require('socket.io');
    users = [];
var io = new Server(server, {
  path: "/socket.io/",
  pingTimeout: 60000,
  pingInterval: 10000,
});
String.prototype.rep = function(find,replace) {
     return this.split(find).join(replace);
};
function fixss(input) {
    var inp = input;
    while (inp.indexOf('javascript:') != -1) {
        inp = inp.split('javascript:').join('');
    }
    inp = inp.rep('&','&amp;').rep('<','&lt;').rep('>','&gt;').rep('"','&quot');
    return inp;
}
app.use('/', express.static(__dirname + '/www'));
//bind the server to the 80 port
//server.listen(3000);//for local test
var listenport = process.env.PORT || 3000;
server.listen(listenport);
console.log('Server started on port'+listenport+'\nGo to http://127.0.0.1:'+listenport+'/ to view locally\n');
//handle the socket
io.sockets.on('connection', function(socket) {
    //new user login
    socket.on('login', function(nickname) {
        if (users.indexOf(nickname) > -1 && nickname.toLowerCase() != 'system') {
            console.log('A user tried to join with existing nickname '+fixss(nickname));
            socket.emit('nickExisted');
        } else {
            //socket.userIndex = users.length;
            var nick = fixss(nickname);
            socket.nickname = nick;
            users.push(nick);
            socket.emit('loginSuccess');
            io.sockets.emit('system', nick, users.length, 'login');
            console.log('User '+nick+' joined');
        };
    });
    //user leaves
    socket.on('disconnect', function() {
        if (socket.nickname != null) {
            //users.splice(socket.userIndex, 1);
            console.log('user '+socket.nickname+' disconnected');
            users.splice(users.indexOf(socket.nickname), 1);
            socket.broadcast.emit('system', socket.nickname, users.length, 'logout');
        }
    });
    //new message get
    socket.on('postMsg', function(msg, color) {
        console.log('got message from '+socket.nickname+' with content: '+fixss(msg));
        socket.broadcast.emit('newMsg', socket.nickname, fixss(msg), fixss(color));
    });
    //new image get
    socket.on('img', function(imgData, color) {
        console.log('got image from '+socket.nickname+' with data size of '+imgData.length+' bytes');
        socket.broadcast.emit('newImg', socket.nickname, fixss(imgData), fixss(color));
    });
});
