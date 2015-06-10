var port = 3030;
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server, { pingInterval: 100000000 });

var sndPrefix = "room:s:";
var recPrefix = "room:r:";

// HTTP Stuff
server.listen(port);
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.get('/', function (req, res) {
  res.render('index', { roomIds: io.sockets.adapter.rooms || [] });
});

// Socket.IO Stuff
io.on("connection", function (socket) {
  socket.on("create", function(data, ackCallback) {
    // create/join a room for sending logs
    var sRoom = sndPrefix + data.room;
    socket.join(sRoom);
    console.log(socket.id + " joined room: " + sRoom);

    // hook event for sending logs to viewers
    var rRoom = recPrefix + data.room;
    socket.on("log", function(data) {
      console.log(data);
      io.to(rRoom).emit("logged", data);
    });

    // Let viewers know room was created
    if(!io.sockets.adapter.rooms[rRoom]) {
      io.emit("created", { room: rRoom.replace("room:r:", "") });
    }

    // send ACK to client so it can start sending logs
    ackCallback();
  });

  socket.on("join", function(data) {
    var rRoom = recPrefix + data.room;
    console.log("joined: " + socket.id + " => " + rRoom);
    socket.join(rRoom);
  });

  socket.on("leave", function(data) {
    var rRoom = recPrefix + data.room;
    console.log("left: " + socket.id + " => " + rRoom);
    socket.leave(rRoom);
  });

  socket.on("disconnect", function () {
    console.log("disconnected: " + socket.id);
  });
});

console.log("Server Started on http://localhost:" + port);
