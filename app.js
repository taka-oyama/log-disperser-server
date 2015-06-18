var _ = require('underscore');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server, { pingInterval: 10000 });
var port = 3030;

var LogReceiver = require('./models/log_receiver');
var LogSender = require('./models/log_sender');

// HTTP Stuff
server.listen(port);
app.locals._ = _;
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.get('/', function (req, res) {
  res.render('index', {
    rooms: _.uniq(Object.keys(LogSender.roomHistories).concat("all"))
  });
});

// Socket.IO Stuff
io.on("connection", function (socket, connCallback) {
  socket.on("create", function(data, ackCallback) {
    LogSender.create(socket, data.room);
    LogSender.create(socket, "all");
    ackCallback();
  });

  socket.on("join", function(data, ackCallback) {
    LogReceiver.create(socket, data.room);
    ackCallback(LogSender.roomHistories[data.room] || []);
  });

  socket.on("leave", function(data) {
    if(LogReceiver.rooms[data.room]) {
      LogReceiver.rooms[data.room].leave();
    }
  });

  socket.on("clear", function(data) {
    for(var key in LogSender.roomHistories) {
      LogSender.roomHistories[key] = [];
    }
    io.to(LogReceiver.prefix + "all").emit("clear");
    console.log("clearing logs for all");
  });
});

console.log("Server Started on http://localhost:" + port);
