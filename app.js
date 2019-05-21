var express = require('express');
var app = express();
var server = require('http').Server(app);

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

server.listen(2000);
console.log("Connected...");

var SOCKETS = [];
var PLAYERS = [];
var LOBBIES = [];
var P_ID = 1;
var L_ID = 1;

var createLobby = function(player_pair) {
    LOBBIES.push(player_pair);
    console.log("LOBBY " + LOBBIES.length + ": " + player_pair.player_1.id + " " + player_pair.player_2.id);
}

var io = require('socket.io')(server, {});
io.sockets.on('connection', function(socket){
    socket.id = P_ID++;
    socket.choice = "NONE";
    PLAYERS.push(socket);

    if (PLAYERS.length % 2 == 0) {
        createLobby({
            player_1: PLAYERS.shift(),
            player_2: PLAYERS.shift(),
            lobby_id: L_ID++,
        });
    }

    socket.on('msg', function(msg){
        console.log('You got a message: ' + msg.txt);
        socket.choice = msg.txt;
    });

    socket.on('chat message', function(msg){
        console.log('message: ' + msg);
        io.emit('chat message', msg);
      });
     
    socket.on('disconnect', function() {

        delete PLAYERS[socket.id];
        PLAYERS.splice(socket.id, 1); // remove player from array
    });
});

setInterval(function() {
    for (var pair in LOBBIES) {
        let p1_choice = LOBBIES[pair].player_1.choice;
        let p2_choice = LOBBIES[pair].player_2.choice;
        if (p1_choice != "NONE" &&
            p2_choice != "NONE") {

            if (p1_choice === "rock" && p2_choice === "sissors") {
                console.log("rock wins");
            } else if (p1_choice === "sissors" && p2_choice === "rock") {
                console.log("sissors wins");
            } else if (p1_choice === "paper" && p2_choice === "sissors") {
                console.log("sissors wins");
            } else if (p1_choice === "sissors" && p2_choice === "rock") {
                console.log("rock wins");
            } else if (p1_choice === "paper" && p2_choice === "sissors") {
                console.log("sissors wins");
            } else if (p1_choice === "paper" && p2_choice === "rock") {
                console.log("paper wins");
            } else {
                console.log("tie");
            }

        }
    }

}, 1000/25);

