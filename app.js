var express = require('express');
var app = express();
var server = require('http').Server(app);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/index.html');
});

//serve lobby.html when action = "/lobby"
app.get('/lobby', (req, res) => {
    res.sendFile(__dirname + '/client/lobby.html');
});

app.use('/client', express.static(__dirname + '/client'));

server.listen(8000);


// helper function that returns an array of the rooms a socket is in
var get_rooms = (socket) => {
    let info = Object.keys(socket.rooms); // socket.rooms is part of socket.io
    let id = info.shift();
    let rooms = [];
    while (info.length > 0) {
        rooms.push(info.shift());
    }

    return rooms;
}


// helper function that returns true if a socket is in a given room
var in_room = (socket, room) => {
    let rooms = get_rooms(socket);
    let room_index = rooms.indexOf(room);
    if (room_index == -1) {
        //console.log('in_room: ' + room + ' not found in current rooms');
        return false;
    }
    return true;
}

// helper function that broadcasts to the room it is in that it is leaving and joins another room
var join_room = (room_to_leave, socket, room_to_join) => {
    let rooms = get_rooms(socket);
    let room_index = rooms.indexOf(room_to_leave);
    if (room_index == -1) { // room to leave not available
        //console.log('join_room: ' + room_to_leave + ' not found in current rooms');
        return;
    }

    // let other sockets this is leaving current room
    socket.broadcast.to(rooms[room_index]).emit('leave_room', {
        id: socket.id,
        room: room_to_leave ,
    });

    // leave room
    socket.leave(rooms[room_index]);

    socket.join(room_to_join);
}

var check_win = (socket) => {
    //get room client is connected too
    let room = get_rooms(socket);
    //get an array of all clients connected to the room (2D array for now)
    let clients = [];

    //Get Id's of each client connected to room
    room.forEach((room) => {
        clients.push(Object.keys(io.sockets.adapter.rooms[room].sockets));
    });

    //debugging information
    try {
        console.log('<----- Game Event: CHECK_WIN() ----->');
        console.log('Room: ' + room);
        console.log('Player 1 choice: ' + SOCKETS[clients[0][0]].choice);
        console.log('Player 2 choice: ' + SOCKETS[clients[0][1]].choice);
        console.log('<----- Game Event:     END     ----->');
    }
    catch(err)
    {
        console.log('Waiting for player to connect...');
    }

    //game logic
    if (SOCKETS[clients[0][0]].choice != 'none' && SOCKETS[clients[0][1]].choice != 'none') {
        if (SOCKETS[clients[0][0]].choice == 'rock' && SOCKETS[clients[0][1]].choice == 'paper')
            io.in(room).emit('winner', 'SERVER: Paper wins')
        else if (SOCKETS[clients[0][0]].choice == 'rock' && SOCKETS[clients[0][1]].choice == 'sissors')
            io.in(room).emit('winner', 'SERVER: Rock wins')
        else if (SOCKETS[clients[0][0]].choice == 'paper' && SOCKETS[clients[0][1]].choice == 'sissors')
            io.in(room).emit('winner', 'SERVER: Sissors wins')
        else if (SOCKETS[clients[0][0]].choice == 'paper' && SOCKETS[clients[0][1]].choice == 'rock')
            io.in(room).emit('winner', 'SERVER: Paper wins')
        else if (SOCKETS[clients[0][0]].choice == 'sissors' && SOCKETS[clients[0][1]].choice == 'paper')
            io.in(room).emit('winner', 'SERVER: Sissors wins')
        else if (SOCKETS[clients[0][0]].choice == 'sissors' && SOCKETS[clients[0][1]].choice == 'rock')
            io.in(room).emit('winner', 'SERVER: Rock wins')
        else
            io.in(room).emit('winner', 'SERVER: Tie game')
        SOCKETS[clients[0][0]].choice = 'none';
        SOCKETS[clients[0][1]].choice = 'none';
    }
}

// helper function that gets the id of a socket
var get_id = (socket) => {
    let info = Object.keys(socket.rooms); // socket.rooms is part of socket.io
    let id = info.shift();

    return id;
}

var SOCKETS = [];
var USERNAMES = [];
var ROOM_NO = 0;



const io = require('socket.io')(server, {});
io.sockets.on('connection', (socket) => {

    // socket.room = 'lobby';
    socket.join('lobby');

    console.log('(user connected...) users in lobby: ' + socket.adapter.rooms.lobby.length);
    socket.emit('join lobby', 'SERVER: Welcome to lobby');
    // [none, rock, paper, scissors] options
    socket.choice = 'none';

    // put socket in list
    SOCKETS[socket.id] = socket;

    // on disconnecting
    socket.on('disconnecting', () => {

    });

    // on disconnect
    socket.on('disconnect', () => {
        
        if (socket.adapter.rooms.lobby) { // if lobby exists ( at least 1 person is in the lobby )
            console.log('(user disconnected...) users in lobby: ' + socket.adapter.rooms.lobby.length);
        } else {
            console.log('(user disconnected...)');
        }
        // let other sockets know of disconnect
        socket.broadcast.to(socket.room).emit('disconnect_', {
            id: socket.id,
        });


        // rooms are left automatically upon disconnect

        // remove socket from 'SOCKETS'
        let i = SOCKETS.indexOf(socket);
        delete SOCKETS[socket.id];
        SOCKETS.splice(i, 1);
    });


    // debugging print
    socket.on('print_socket', () => {
        console.group('CURRENT_SOCKET:');
        console.log("Username: " + socket.username)
        console.log('ID: ' + get_id(socket));
        console.log('ROOMS: ' + get_rooms(socket));
        console.groupEnd();
    });


    // join a game
    socket.on('join_game', () => {
        if (in_room(socket, 'lobby')) {
            let room_to_join = 'room-' + ROOM_NO;
            join_room('lobby', socket, room_to_join);
            console.log('room-' + ROOM_NO + ' length: ' + socket.adapter.rooms['room-' + ROOM_NO].length);
            io.in(room_to_join).emit('get room', room_to_join);
            if (socket.adapter.rooms[room_to_join].length == 2) {
                ++ROOM_NO;
            }
        }
    });

    //handles chat in each room or else default into global lobby chat
    socket.on('chat message', function(msg){
        if (!in_room(socket, 'lobby')) {
            console.log('message: ' + msg);
            let room = get_rooms(socket);
            console.log('Room: '+ room);
    
            io.in(room).emit('chat message', msg);
        }
        else
            io.in('lobby').emit('chat message', msg);
    });    

    // player makes a choice [none, rock, paper, scissors]
    socket.on('game_choice', (data) => {
        // make sure player is in room
        if (in_room(socket, 'lobby') == false) {

            // set the player choice [none, rock, paper, scissors]
            socket.choice = data.choice;
            let rooms = get_rooms(socket);
            io.in(rooms).emit('game_choice', socket.choice);

            check_win(socket);
        }
    });

    socket.on('get username', (uname) => {
        socket.username = uname
        USERNAMES[uname] = socket.username;
        console.log(socket.username);
    });

    // not used
    socket.on('emit_to_me', () => {
        socket.emit('response_to_you');
    });

    // not used
    socket.on('emit_to_room', () => {
        socket.broadcast.to(socket.room).emit('response_to_room');
    });

});

