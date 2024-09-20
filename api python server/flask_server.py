from flask import Flask, request, jsonify
from game import Game
from gameDB import GameDB
from Player import Player
from flask_cors import CORS  # Import CORS
import openai


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


@app.route('/update_player_votes/<game_id>/<player_name>', methods=['PATCH'])
def update_player_votes(game_id, player_name):
    data = request.get_json()
    votes = data.get('votes')
    
    game = game_db.get_game(game_id)
    if game is None:
        return jsonify({"message": "Game not found"}), 404

    # Find the player and update the vote count
    player = next((p for p in game.players if p.name == player_name), None)
    if player is None:
        return jsonify({"message": "Player not found"}), 404

    player.vote_count += votes  # Increment the vote count
    return jsonify({"message": f"Player {player_name} now has {player.vote_count} votes"}), 200

@app.route('/list_games', methods=['GET'])
def list_games():
    games = game_db.list_games()

    # Prepare a list of games for JSON response
    games_list = {game_id: game.to_dict() for game_id, game in games.items()}
    
    return jsonify(games_list), 200



@app.route('/analyze_game/<game_id>', methods=['GET'])
def analyze_game(game_id):
    game = game_db.get_game(game_id)
    if game is None:
        return jsonify({"message": "Game not found"}), 404

    # Prepare game data for GPT analysis
    game_data = game.to_dict()
    
    # Call the GPT API
    analysis = get_game_analysis_from_gpt(game_data)
    
    return jsonify({"analysis": analysis}), 200

import openai

def get_game_analysis_from_gpt(game_data):
    openai.api_key = "API KEY"

    # Prepare the message format for the chat model
    messages = [
        {"role": "system", "content": "You are a game analyst."},
        {"role": "user", "content": f"Analyze the current game state: {game_data}"}
    ]

    response = openai.ChatCompletion.create(
        model="gpt-4",  
        messages=messages,
        max_tokens=100,
        n=1,
        stop=None,
        temperature=0.7,
    )

    return response['choices'][0]['message']['content'].strip()


if __name__ == '__main__':
    app.run(port=5000, debug=True)
