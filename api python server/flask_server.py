from flask import Flask, request, jsonify

app = Flask(__name__)

# Endpoint to receive voting results
@app.route('/receive_voting_results', methods=['POST'])
def receive_voting_results():
    data = request.get_json()  # Get the JSON data from the request
    print("Received voting results:", data)  # Print the data for debugging
    # You can process the voting results here (e.g., store them in a database or file)
    
    return jsonify({"message": "Voting results received successfully"}), 200

if __name__ == '__main__':
    app.run(port=5000, debug=True)