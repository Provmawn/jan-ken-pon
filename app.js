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
var roomno = 0;

var io = require('socket.io')(server, {});
io.sockets.on('connection', function(socket){
    console.log("User connected...");
    PLAYERS.push(socket.id);

    /*
    //Increase roomno 2 clients are present in a room.
   if(io.nsps['/'].adapter.rooms["room-"+roomno] && io.nsps['/'].adapter.rooms["room-"+roomno].length > 1) roomno++;
   socket.join("room-"+roomno);

   //Send this event to everyone in the room.
   io.sockets.in("room-"+roomno).emit('connectToRoom', "You are in room no. "+roomno);

   */

    for (var key in PLAYERS) {
        console.log(PLAYERS[key]);
    }

    socket.on('msg', function(msg){
        console.log('You got a message: ' + msg.txt);
    });

    socket.on('chat message', function(msg){
        console.log('message: ' + msg);
        io.emit('chat message', msg);
      });
     
    socket.on('disconnect', function(socket) {
        console.log("User Has left...");
        delete PLAYERS[socket.id];
        PLAYERS.splice(socket.id, 1); // remove player from array

        console.log("Number of live Connections: " + PLAYERS.length);
        //socket.leave("room-"+roomno);

    });
});
