var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

server.listen(80); //for local test
//server.listen(process.env.PORT || 3000);//for publish to heroku

app.use("/", express.static(__dirname + '/public'));

io.sockets.on('connection', function (socket) {
  socket.on('msg', function (data) {
    io.sockets.emit('new', data);
  });
});
