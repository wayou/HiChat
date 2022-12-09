var express = require('express'),
    app = express(),
    server = require('http').createServer(app),
    { Server } = require('socket.io');
    users = [];
//specify the html we will use
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
server.listen(process.env.PORT || 3000);//publish to heroku
//server.listen(process.env.OPENSHIFT_NODEJS_PORT || 3000);//publish to openshift
//console.log('server started on port'+process.env.PORT || 3000);
//handle the socket
io.sockets.on('connection', function(socket) {
    //new user login
    socket.on('login', function(nickname) {
        if (users.indexOf(nickname) > -1) {
            socket.emit('nickExisted');
        } else {
            //socket.userIndex = users.length;
            var nick = fixss(nickname);
            socket.nickname = nick;
            users.push(nick);
            socket.emit('loginSuccess');
            io.sockets.emit('system', nick, users.length, 'login');
        };
    });
    //user leaves
    socket.on('disconnect', function() {
        if (socket.nickname != null) {
            //users.splice(socket.userIndex, 1);
            users.splice(users.indexOf(socket.nickname), 1);
            socket.broadcast.emit('system', socket.nickname, users.length, 'logout');
        }
    });
    //new message get
    socket.on('postMsg', function(msg, color) {
        socket.broadcast.emit('newMsg', socket.nickname, fixss(msg), fixss(color));
    });
    //new image get
    socket.on('img', function(imgData, color) {
        socket.broadcast.emit('newImg', socket.nickname, fixss(imgData), fixss(color));
    });
});
