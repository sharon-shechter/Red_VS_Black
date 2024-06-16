const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

let groups = {};

io.on('connection', (socket) => {
  console.log('a user connected');

  socket.on('join group', ({ groupId, username }) => {
    if (!groups[groupId]) {
      groups[groupId] = [];
    }
    groups[groupId].push({ id: socket.id, name: username });
    socket.join(groupId);
    io.to(groupId).emit('update users', groups[groupId].map(user => user.name));
  });

  socket.on('disconnect', () => {
    for (let groupId in groups) {
      groups[groupId] = groups[groupId].filter(user => user.id !== socket.id);
      io.to(groupId).emit('update users', groups[groupId].map(user => user.name));
    }
  });
});

app.get('/make-group', (req, res) => {
  const groupId = uuidv4();
  res.json({ groupId });
});

server.listen(3001, () => {
  console.log('listening on *:3001');
});
