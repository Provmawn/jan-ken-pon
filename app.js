var express = require('express');
var app = express();
var server = require('http').Server(app);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

server.listen(2000);
console.log("Connected...");

var io = require('socket.io')(server, {});

io.sockets.on('connection', function(socket){
    console.log("User connected...");

    socket.on('msg', function(msg){
        console.log('You got a message: ' + msg.txt);
    });

    socket.on('disconnect', function(socket) {
        console.log("User disconnected");
        delete socket;
    });
});
