from flask import Flask, request, jsonify
from game import Game
from gameDB import GameDB
from Player import Player
from flask_cors import CORS  # Import CORS

app = Flask(__name__)
CORS(app) 
# Initialize the GameDB
game_db = GameDB()

# Endpoint to create a new game (game_id is passed in the URL)
@app.route('/create_game/<game_id>', methods=['POST'])
def create_game(game_id):
    if game_db.game_exists(game_id):
        return jsonify({"message": "Game already exists"}), 400

    new_game = Game(game_id)
    game_db.add_game(new_game)
    print(f'games : {game_db.games}')
    return jsonify({"message": f"Game {game_id} created successfully"}), 201

# Endpoint to delete a game
@app.route('/delete_game/<game_id>', methods=['DELETE'])
def delete_game(game_id):
    if not game_db.game_exists(game_id):
        return jsonify({"message": "Game not found"}), 404

    game_db.delete_game(game_id)
    return jsonify({"message": f"Game {game_id} deleted successfully"}), 200

# Endpoint to retrieve a game
@app.route('/get_game/<game_id>', methods=['GET'])
def get_game(game_id):
    game = game_db.get_game(game_id)
    if game is None:
        return jsonify({"message": "Game not found"}), 404

    return jsonify(game.to_dict()), 200

# Endpoint to add a player to a game
@app.route('/add_player/<game_id>', methods=['POST'])
def add_player(game_id):
    data = request.get_json()
    player_name = data.get('name')
    player_color = data.get('color')

    game = game_db.get_game(game_id)
    if game is None:
        return jsonify({"message": "Game not found"}), 404

    new_player = Player(player_name, player_color)
    game.add_player(new_player)
    return jsonify({"message": f"Player {player_name} added to game {game_id}"}), 200

if __name__ == '__main__':
    app.run(port=5000, debug=True)
