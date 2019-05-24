var express = require('express');
var app = express();
var server = require('http').Server(app);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/client/index.html');
});

app.use('/client', express.static(__dirname + '/client'));

server.listen(8080);


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

// helper function that gets the id of a socket
var get_id = (socket) => {
    let info = Object.keys(socket.rooms); // socket.rooms is part of socket.io
    let id = info.shift();

    return id;
}

var SOCKETS = [];

var ROOM_NO = 0;



const io = require('socket.io')(server, {});
io.sockets.on('connection', (socket) => {

    // socket.room = 'lobby';
    socket.join('lobby');

    console.log('(user connected...) users in lobby: ' + socket.adapter.rooms.lobby.length);

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
            if (socket.adapter.rooms[room_to_join].length == 2) {
                ++ROOM_NO;
            }
        }
    });

    // player makes a choice [none, rock, paper, scissors]
    socket.on('game_choice', (data) => {
        // make sure player is in room
        if (in_room(socket, 'lobby') == false) {

            // set the player choice [none, rock, paper, scissors]
            socket.choice = data.choice;

            let rooms = get_rooms(socket);
            let sockets_in_rooms = [];

            // get a 2d array of the 'rooms' and 'sockets in each room' ex: [[id, id, id], [id, id, id]]
            rooms.forEach((room) => {
                sockets_in_rooms.push(Object.keys(io.sockets.adapter.rooms[room].sockets));
            });

            // loop through each socket in each room
            sockets_in_rooms.forEach((ids) => {
                console.group(rooms);
                ids.forEach((id, index) => {
                    console.log('player ' + (index + 1) + ': ' + SOCKETS[id].choice);
                });
                console.groupEnd();
            });
        }
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

