var LogReceiver = require('./log_receiver');

function LogSender(socket, roomName) {
  var self = this;

  this.socket = socket;
  this._history = [];
  this.roomName = roomName;
  this.sRoomId = LogSender.prefix + roomName;
  this.rRoomId = LogReceiver.prefix + roomName;

  socket.join(this.sRoomId);
  socket.on("disconnect", function () {
    console.log("disconnected: " + socket.id);
  });

  // Let viewers know room was created
  if(!socket.server.sockets.adapter.rooms[this.rRoomId]) {
    socket.server.emit("created", { room: roomName });
  }

  // add instance to rooms
  LogSender.rooms[roomName] = this;

  if(!LogSender.roomHistories[roomName]) {
    LogSender.roomHistories[roomName] = [];
  }

  // hook event for sending logs to viewers
  socket.on("log", function(data) { self.emitLog(data); });

  console.log(socket.id + " joined room: " + this.sRoomId);
};

// global access to rooms
LogSender.rooms = {};
LogSender.roomHistories = {};
LogSender.prefix = "room:s:";
LogSender.create = function(socket, roomName) {
  return new LogSender(socket, roomName)
}

LogSender.prototype = {
  emitLog: function(data) {
    data.time = new Date(data.time).getTime();
    this._pushToLocalHistory(data);
    this._pushToRoomHistories(data);
    this.socket.server.to(this.rRoomId).emit("logged", data);
    return data;
  },

  instanceHistory: function() {
    return this._history;
  },

  roomHistory: function() {
    return LogSender.roomHistories[this.roomName];
  },

  _pushToLocalHistory: function(item) {
    this._history.push(item);
    if(this._history.size > 100) {
      this._history.shift();
    }
  },

  _pushToRoomHistories: function(item) {
    var histories = LogSender.roomHistories[this.roomName];
    histories.push(item);
    if(histories.size > 1000) {
      histories.shift();
    }

  }
};

module.exports = LogSender;
