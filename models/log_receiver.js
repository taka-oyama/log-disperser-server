function LogReceiver(socket, roomName) {
  this.socket = socket;
  this.roomName = roomName;
  this.rRoomId = LogReceiver.prefix + roomName;

  socket.join(this.rRoomId);

  // add instance to rooms
  LogReceiver.rooms[roomName] = this;

  console.log("joined: " + socket.id + " => " + this.rRoomId);
}

LogReceiver.rooms = {};
LogReceiver.prefix = "room:r:";
LogReceiver.create = function(socket, roomName) {
  return new LogReceiver(socket, roomName)
}

LogReceiver.prototype = {
  leave: function() {
    this.socket.leave(this.rRoomId);
    console.log("left: " + this.socket.id + " => " + this.rRoomId);
  }
};

module.exports = LogReceiver;
