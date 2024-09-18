const axios = require('axios');

const BASE_URL = 'http://localhost:5000';  // Your Flask server URL

// Function to create a new game
async function createGame(gameId) {
    try {
        const response = await axios.post(`${BASE_URL}/create_game/${gameId}`);
        return response.data;
    } catch (error) {
        console.error('Error creating game:', error.response ? error.response.data : error.message);
        throw error;
    }
}

// Function to delete a game
async function deleteGame(gameId) {
    try {
        const response = await axios.delete(`${BASE_URL}/delete_game/${gameId}`);
        return response.data;
    } catch (error) {
        console.error('Error deleting game:', error.response ? error.response.data : error.message);
        throw error;
    }
}

// Function to get game details
async function getGame(gameId) {
    try {
        const response = await axios.get(`${BASE_URL}/get_game/${gameId}`);
        return response.data;
    } catch (error) {
        console.error('Error getting game:', error.response ? error.response.data : error.message);
        throw error;
    }
}

// Function to add a player to a game
async function addPlayerToGame(gameId, playerName, playerColor) {
    try {
        const response = await axios.post(`${BASE_URL}/add_player/${gameId}`, {
            name: playerName,
            color: playerColor
        });
        return response.data;
    } catch (error) {
        console.error('Error adding player to game:', error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = {
    createGame,
    deleteGame,
    getGame,
    addPlayerToGame
};
