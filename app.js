var _ = require('underscore');
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server, { pingInterval: 100000000 });
var port = 3030;

var LogReceiver = require('./log_receiver');
var LogSender = require('./log_sender');
var senders = LogSender.rooms;
var recievers = LogReceiver.rooms;

// HTTP Stuff
server.listen(port);
app.locals._ = require('underscore');
app.set('view engine', 'ejs');
app.set('views', './views');
app.use(express.static('public'));
app.get('/', function (req, res) {
  var roomIds = Object.keys(io.sockets.adapter.rooms);
  var rRoomIds = _.filter(roomIds, function(id) { return id.indexOf(LogReceiver.prefix) >= 0; });
  var rooms = _.map(rRoomIds, function(id) { return id.replace("room:r:", ""); }).concat("all");
  res.render('index', { rooms: _.uniq(rooms) || [] });
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
    ackCallback(senders[data.room] ? senders[data.room].history : []);
  });

  socket.on("leave", function(data) {
    if(recievers[data.room]) {
      recievers[data.room].leave();
    }
  });
});

console.log("Server Started on http://localhost:" + port);
