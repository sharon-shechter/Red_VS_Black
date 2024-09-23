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
async function addPlayerToGame(gameId, playerName, playerColor, playerPhoto) {
    try {
        const response = await axios.post(`${BASE_URL}/add_player/${gameId}`, {
            name: playerName,
            color: playerColor,
            photo: playerPhoto  // Include the photo in the request
        });
        return response.data;
    } catch (error) {
        console.error('Error adding player to game:', error.response ? error.response.data : error.message);
        throw error;
    }
}

// Function to update the player's vote count
async function updatePlayerVotes(gameId, playerName, votes) {
    try {
        const response = await axios.patch(`${BASE_URL}/update_player_votes/${gameId}/${playerName}`, {
            votes: votes
        });
        return response.data;
    } catch (error) {
        console.error('Error updating player votes:', error.response ? error.response.data : error.message);
        throw error;
    }
}
async function analyzeGame(gameId) {
    try {
        const response = await axios.get(`${BASE_URL}/analyze_game/${gameId}`);
        return response.data.analysis;
    } catch (error) {
        console.error('Error analyzing game:', error.response ? error.response.data : error.message);
        throw error;
    }
}
async function convertPhotoToAsset(playerName, photoData) {
    try {
        const response = await axios.post(`${BASE_URL}/convert_photo_to_asset`, {
            name: playerName,
            photo: photoData  // Send the base64 encoded photo
        });
        return response.data.asset_url;  // Return the generated asset URL
    } catch (error) {
        console.error('Error converting photo to asset:', error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = {
    createGame,
    deleteGame,
    getGame,
    addPlayerToGame,
    updatePlayerVotes,
    analyzeGame,
    convertPhotoToAsset
};