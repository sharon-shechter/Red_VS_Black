class Player:
    def __init__(self, name, color, vote_count=0):
        """
        Initialize a new Player object.

        :param name: The name of the player.
        :param color: The color of the player (e.g., 'red' or 'black').
        :param vote_count: The number of votes the player has received.
        """
        self.name = name
        self.color = color
        self.vote_count = vote_count  # New field to track votes

    def __repr__(self):
        """
        Return a string representation of the Player object.

        :return: A string describing the player's name, color, and vote count.
        """
        return f"Player(name={self.name}, color={self.color}, vote_count={self.vote_count})"

    def to_dict(self):
        """
        Convert the Player object to a dictionary for easy serialization.

        :return: A dictionary representing the player.
        """
        return {
            "name": self.name,
            "color": self.color,
            "vote_count": self.vote_count  # Include vote count in the dictionary
        }

    @staticmethod
    def from_dict(player_dict):
        """
        Create a Player object from a dictionary.

        :param player_dict: A dictionary containing player details.
        :return: A Player object.
        """
        return Player(player_dict['name'], player_dict['color'], player_dict.get('vote_count', 0))
