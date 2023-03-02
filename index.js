const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const { addUser, removeUser, getUser, getUsersInRoom } = require("./src/users/Users");
const port = process.env.PORT || 3000;


io.on('connection', (socket) => {

  console.log('a user connected');

  //disconnect
  socket.on('disconnect', () => {
    const user = getUser(socket.id);
    if (user) {
      console.log(`user disconnected the ${user.room} room.`);
      io.to(user.room).emit('chat message', `${user.name} is now offline. Bye !`);
    }
  });

  //chat message
  socket.on('chat message', msg => {
    io.emit('chat message', msg);
    console.log(msg)
  });

  //join
  socket.on('join', ({ name, room }) => {
    const { error, user } = addUser(
    { id: socket.id, name, room });
    console.log(`${name} is connected inside room: ${room}`);
    
    socket.emit('chat message',
    `${user.name}, welcome to the room ${user.room}.`);
  
    socket.broadcast.to(user.room)
    .emit('chat message', `${user.name}, has joined.`);
    socket.join(user.room);
  });

});


app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});