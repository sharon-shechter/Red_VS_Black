const { handleJoinGroup, handleStartGame, handleSubmitVote, handleTurnRed, handleDisconnect } = require('./gameLogic');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('join group', (data) => handleJoinGroup(io, socket, data));
    socket.on('start game', (data) => handleStartGame(io, socket, data));
    socket.on('submit vote', (data) => handleSubmitVote(io, socket, data));
    socket.on('turn red', (data) => handleTurnRed(io, socket, data));
    socket.on('disconnect', () => handleDisconnect(io, socket));
  });
};