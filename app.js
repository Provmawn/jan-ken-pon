var express = require('express');
var app = express();
var server = require('http').Server(app);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

server.listen(2000);

var SOCKET_LIST = {};

var io = require('socket.io')(server, {});
io.sockets.on('connection', function(socket) {

    socket.x = 0;
    socket.y = 0;
    SOCKET_LIST[Math.random()] = socket;

});

setInterval(function() {
    var packet = [];

    for (var key in SOCKET_LIST) {
        var socket = SOCKET_LIST[key];
        socket.x++;
        socket.y++;
        packet.push({
            x: socket.x,
            y: socket.y
        });
    }

    for (var key in SOCKET_LIST) {
        var socket = SOCKET_LIST[key];
        socket.emit('clear_screen');
        socket.emit('update_position', packet);
    }

}, 1000 / 25);
