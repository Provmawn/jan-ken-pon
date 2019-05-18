var express = require('express');
var app = express();
var server = require('http').Server(app);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

server.listen(2000);
console.log("Connected...");

var PLAYERS = [];
var LOBBIES = [];

var createLobby = function(player_pair) {

}

var io = require('socket.io')(server, {});
io.sockets.on('connection', function(socket){
    console.log("User connected...");
    socket.id = Math.random();
    PLAYERS.push(socket.id);
    if (PLAYERS.length % 2 == 0) {
        createLobby({
            player_1: PLAYERS.shift(),
            player_2: PLAYERS.shift()
        });

    }
    for (var key in PLAYERS) {
        console.log(PLAYERS[key]);
    }

    socket.on('msg', function(msg){
        console.log('You got a message: ' + msg.txt);
    });

    socket.on('disconnect', function(socket) {
        console.log("User disconnected");
        console.log("SIZE OF PLAYERS: " + PLAYERS.length);

        delete PLAYERS[socket.id];
        PLAYERS.splice(socket.id, 1); // remove player from array
    });
});
