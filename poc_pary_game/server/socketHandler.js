const { handleJoinGroup, handleStartGame, handleSubmitVote, handleTurnRed, handleDisconnect } = require('./gameLogic');
const { groups } = require('./gameState');
const { deleteGame } = require('../api/apiService');  // Import deleteGame from apiService

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('join group', (data) => {
      handleJoinGroup(io, socket, data);

      // After joining the group, print the number of users connected to the group (game)
      printConnectedUsersForGroup(data.groupId);
    });

    socket.on('start game', (data) => handleStartGame(io, socket, data));
    socket.on('submit vote', (data) => handleSubmitVote(io, socket, data));
    socket.on('turn red', (data) => handleTurnRed(io, socket, data));

    socket.on('disconnect', () => {
      handleDisconnect(io, socket);

      // Check all groups and print updated connected users after disconnect
      Object.keys(groups).forEach(groupId => printConnectedUsersForGroup(groupId));
    });
  });
};

// Function to print the number of connected users and their names for a specific groupId
async function printConnectedUsersForGroup(groupId) {
  const group = groups[groupId];
  if (!group || group.length === 0) {
    console.log(`Group_id: ${groupId} - Connected users: 0`);

    // Call the deleteGame API since there are no more connected users
    try {
      await deleteGame(groupId);  // Use the deleteGame function from apiService
      console.log(`Game ${groupId} deleted successfully.`);
    } catch (error) {
      console.error(`Failed to delete game ${groupId}:`, error);
    }

    return;
  }
  
  const userCount = group.length;
  const userNames = group.map(user => user.name);
  console.log(`Group_id: ${groupId} - Connected users: ${userCount}`);
  console.log(`Usernames: ${userNames.join(', ')}`);
}
