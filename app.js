var port = 3030;
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server, { pingInterval: 100000000 });

var sndPrefix = "room:s:";
var recPrefix = "room:r:";
var sAllRoom = sndPrefix + "all";
var rAllRoom = recPrefix + "all";
var FramedArray = function() {}
FramedArray.prototype.ref = [];
FramedArray.prototype.frameSize = 100;
FramedArray.prototype.add = function(item) {
  this.ref.push(item);
  if(this.ref.size > this.frameSize) {
    this.ref.shift();
  }
};

var frames = {};

// HTTP Stuff
server.listen(port);
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.get('/', function (req, res) {
  roomIds = io.sockets.adapter.rooms;
  roomIds[sAllRoom] = {};
  res.render('index', { roomIds: io.sockets.adapter.rooms || [] });
});

// Socket.IO Stuff
io.on("connection", function (socket, connCallback) {
  socket.on("create", function(data, ackCallback) {
    // create/join a room for sending logs
    var sRoom = sndPrefix + data.room;
    frames[sRoom] = frames[sRoom] || new FramedArray();
    socket.join(sRoom);
    console.log(socket.id + " joined room: " + sRoom);

    // hook event for sending logs to viewers
    var rRoom = recPrefix + data.room;
    socket.on("log", function(data) {
      console.log(data);
      frames[sRoom].add(data);
      data.time = new Date(data.time).getTime();
      io.to(rRoom).emit("logged", data);
      io.to(rAllRoom).emit("logged", data);
    });

    // Let viewers know room was created
    if(!io.sockets.adapter.rooms[rRoom]) {
      io.emit("created", { room: rRoom.replace("room:r:", "") });
    }

    socket.on("disconnect", function () {
      io.to(rAllRoom).emit("disconnected", { room: sRoom });
      console.log("disconnected: " + socket.id);
    });

    // send ACK to client so it can start sending logs
    ackCallback();
  });

  socket.on("join", function(data, ackCallback) {
    var rRoom = recPrefix + data.room;
    var sRoom = sndPrefix + data.room;
    console.log("joined: " + socket.id + " => " + rRoom);
    socket.join(rRoom);
    frames[sRoom] = frames[sRoom] || new FramedArray();
    if(ackCallback) {
      ackCallback(frames[sRoom].ref);
    }
  });

  socket.on("leave", function(data) {
    var rRoom = recPrefix + data.room;
    console.log("left: " + socket.id + " => " + rRoom);
    socket.leave(rRoom);
    socket.leave(rAllRoom);
  });

  socket.join(rAllRoom);
});

console.log("Server Started on http://localhost:" + port);
