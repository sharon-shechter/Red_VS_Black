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

openai.api_key = "MY API KEY"

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
@app.route('/delete_game/<game_id>', methods=['DELETE'])
def delete_game(game_id):
    """
    Delete a game by game_id. This will remove the game from the GameDB and 
    delete the associated game photos directory.
    """
    game = game_db.get_game(game_id)
    if game is None:
        return jsonify({"message": "Game not found"}), 404

    # Remove the game from the game database
    game_db.delete_game(game_id)

    # Delete the game photos directory if it exists
    game_dir = os.path.join(GAMES_PHOTOS_DIR, game_id)
    if os.path.exists(game_dir):
        shutil.rmtree(game_dir)
        print(f"Successfully deleted directory: {game_dir}")

    return jsonify({"message": f"Game {game_id} deleted successfully."}), 200
        

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
    player_photo = data.get('photo')  # This is now the asset URL, not the base64 photo

    game = game_db.get_game(game_id)
    if game is None:
        return jsonify({"message": "Game not found"}), 404

    # Create a new player and assign the photo
    new_player = Player(player_name, player_color)
    new_player.photo = player_photo  # Assign the photo URL to the player

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

# Save player's photo to the game directory
@app.route('/save_photo', methods=['POST'])
def save_photo():
    data = request.get_json()
    game_id = data['game_id']
    player_name = data['player_name']
    photo_base64 = data['photo']

    # Decode the base64 photo
    photo_data = base64.b64decode(photo_base64.split(',')[1])

    # Create game directory if not exists
    game_dir = os.path.join(GAMES_PHOTOS_DIR, game_id)
    if not os.path.exists(game_dir):
        os.makedirs(game_dir)

    # Save photo as .jpg file
    photo_path = os.path.join(game_dir, f'{player_name}.jpg')
    with open(photo_path, 'wb') as f:
        f.write(photo_data)

    return jsonify({"message": f"Photo saved for {player_name}"}), 200

# Convert the saved photo to game asset using DALL·E API
@app.route('/convert_to_asset', methods=['POST'])
def convert_to_asset():
    data = request.get_json()
    game_id = data['game_id']
    player_name = data['player_name']

    # Get the photo path
    photo_path = os.path.join(GAMES_PHOTOS_DIR, game_id, f'{player_name}.jpg')

    # Prepare the prompt for DALL·E to convert the photo to game asset
    prompt = f"Convert this player photo into a game character asset for player {player_name}"

    # Call DALL·E API
    response = openai.Image.create(
        model="dall-e-2",
        prompt=prompt,
        n=1,
        size="512x512"
    )

    asset_url = response['data'][0]['url']

    # Optionally, save the asset back to the server or game DB
    save_player_asset(game_id, player_name, asset_url)

    return jsonify({"asset": asset_url}), 200




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

def save_player_asset(game_id, player_name, asset_url):
    # Save the asset URL to the player's record in your game DB
    # This can be extended to save to your actual database
    game_dir = os.path.join(GAMES_PHOTOS_DIR, game_id)
    asset_file = os.path.join(game_dir, f'{player_name}_asset.txt')

    with open(asset_file, 'w') as f:
        f.write(asset_url)

    print(f"Asset saved for player {player_name}: {asset_url}")

if __name__ == '__main__':
    app.run(port=5000, debug=True)