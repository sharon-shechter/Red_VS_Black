from flask import Flask, jsonify
from flask_cors import CORS
import random
import string

app = Flask(__name__)
CORS(app)  # This will enable CORS for all routes

@app.route('/make-group', methods=['GET'])
def make_group():
    group_id = ''.join(random.choices(string.ascii_lowercase, k=8))
    return jsonify({'groupId': group_id})

if __name__ == '__main__':
    app.run(port=5000)
