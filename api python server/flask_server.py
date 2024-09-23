import os
import shutil  # Import shutil to delete directories
from flask import Flask, request, jsonify
from game import Game
from gameDB import GameDB
from Player import Player
from flask_cors import CORS  
import openai
import base64
from PIL import Image
from io import BytesIO

openai.api_key = "API KEY"

app = Flask(__name__)
CORS(app) 
# Initialize the GameDB
game_db = GameDB()


GBASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Get the current file's directory
GAMES_PHOTOS_DIR = os.path.join(GBASE_DIR, 'games_photos')  

# Ensure the games_photos directory exists
if not os.path.exists(GAMES_PHOTOS_DIR):
    os.makedirs(GAMES_PHOTOS_DIR)


# Endpoint to create a new game (game_id is passed in the URL)
@app.route('/create_game/<game_id>', methods=['POST'])
def create_game(game_id):
    if game_db.game_exists(game_id):
        return jsonify({"message": "Game already exists"}), 400

    # Create a new directory for the game inside "games_photos"
    game_dir = os.path.join(GAMES_PHOTOS_DIR, game_id)
    os.makedirs(game_dir, exist_ok=True)

    new_game = Game(game_id)
    game_db.add_game(new_game)
    return jsonify({"message": f"Game {game_id} created successfully"}), 201


# Endpoint to delete a game
@app.route('/delete_game/<group_id>', methods=['DELETE'])
def delete_game(group_id):
    try:
        # Define the path to the group's photo directory
        photos_dir = os.path.join(GAMES_PHOTOS_DIR, group_id)

        # Check if the directory exists
        if os.path.exists(photos_dir):
            # Remove the directory and all of its contents
            shutil.rmtree(photos_dir)
            print(f"Successfully deleted directory: {photos_dir}")
            return jsonify({"message": f"Game {group_id} and its photos deleted successfully."}), 200
        else:
            print(f"Directory not found: {photos_dir}")
            return jsonify({"error": "Game directory not found."}), 404

    except Exception as e:
        print(f"Error deleting directory: {str(e)}")
        return jsonify({"error": str(e)}), 500\
        

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
    player_photo = data.get('photo')  # Get the base64 photo

    game = game_db.get_game(game_id)
    if game is None:
        return jsonify({"message": "Game not found"}), 404

    # If a photo is provided, save it
    if player_photo:
        try:
            save_player_photo(game_id, player_name, player_photo)
        except Exception as e:
            return jsonify({"message": f"Failed to save player photo: {str(e)}"}), 500

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




def get_game_analysis_from_gpt(game_data):

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



# Helper function to save the player's photo as a PNG
def save_player_photo(game_id, player_name, photo_base64):
    game_dir = os.path.join(GAMES_PHOTOS_DIR, game_id)

    # Decode the base64 photo
    photo_data = base64.b64decode(photo_base64.split(',')[1])

    # Convert the photo data to an image and save it as .png
    img = Image.open(BytesIO(photo_data))
    photo_path = os.path.join(game_dir, f'{player_name}.png')
    img.save(photo_path, 'PNG')

    print(f"Photo saved for player {player_name} in game {game_id} at {photo_path}")


if __name__ == '__main__':
    app.run(port=5000, debug=True)
