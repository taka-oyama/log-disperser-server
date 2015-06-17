var LogReceiver = require('./log_receiver');

function LogSender(socket, roomName) {
  var self = this;

  this.socket = socket;
  this.history = [];
  this.roomName = roomName;
  this.sRoomId = LogSender.prefix + roomName;
  this.rRoomId = LogReceiver.prefix + roomName;

  socket.join(this.sRoomId);
  socket.on("disconnect", function () {
    LogSender.rooms[roomName] = null;
    console.log("disconnected: " + socket.id);
  });

  // Let viewers know room was created
  if(!socket.server.sockets.adapter.rooms[this.rRoomId]) {
    socket.server.emit("created", { room: roomName });
  }

  // hook event for sending logs to viewers
  socket.on("log", function(data) { self.emitLog(data); });

  // add instance to rooms
  LogSender.rooms[roomName] = this;

  console.log(socket.id + " joined room: " + this.sRoomId);
};

// global access to rooms
LogSender.rooms = {};
LogSender.prefix = "room:s:";
LogSender.create = function(socket, roomName) {
  return new LogSender(socket, roomName)
}

LogSender.prototype = {
  emitLog: function(data) {
    data.time = new Date(data.time).getTime();
    this._pushToHistory(data);
    this.socket.server.to(this.rRoomId).emit("logged", data);
    return data;
  },

  _pushToHistory: function(item) {
    this.history.push(item);
    if(this.history.size > 100) {
      this.history.shift();
    }
  }
};

module.exports = LogSender;
