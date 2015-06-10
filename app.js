var express = require('express');
var app = express();
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));

var server = require('http').Server(app);
var io = require('socket.io')(server, { pingInterval: 100000000 });

var sndPrefix = "room:s:";
var recPrefix = "room:r:"

server.listen(3030);

app.get('/', function (req, res) {
  res.render('index', { rooms: io.sockets.adapter.rooms });
});

io.on('connection', function (socket) {
  socket.on("create", function(data, ackCallback) {
    console.log(data);
    var sRoom = sndPrefix + data.room;
    var rRoom = recPrefix + data.room;
    socket.join(sRoom);
    socket.on("log", function(data) {
      console.log(data);
      io.to(rRoom).emit("logged", data);
    });
    ackCallback();
  });

  socket.on("join", function(data) {
    var rRoom = recPrefix + data.room;
    console.log('joined: ' + socket.conn.id + " => " + rRoom);
    socket.join(recPrefix + data.room);
  });

  socket.on("leave", function(data) {
    socket.leave(sndPrefix + data.room);
    socket.leave(recPrefix + data.room);
  });

  socket.on('disconnect', function () {
    console.log('disconnected: ' + socket.conn.id);
  });
});
