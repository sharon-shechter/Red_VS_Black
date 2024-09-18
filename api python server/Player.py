class Player:
    def __init__(self, name, color):
        """
        Initialize a new Player object.

        :param name: The name of the player.
        :param color: The color of the player (e.g., 'red' or 'black').
        """
        self.name = name
        self.color = color

    def __repr__(self):
        """
        Return a string representation of the Player object.

        :return: A string describing the player's name and color.
        """
        return f"Player(name={self.name}, color={self.color})"

    def to_dict(self):
        """
        Convert the Player object to a dictionary for easy serialization.

        :return: A dictionary representing the player.
        """
        return {
            "name": self.name,
            "color": self.color
        }

    @staticmethod
    def from_dict(player_dict):
        """
        Create a Player object from a dictionary.

        :param player_dict: A dictionary containing player details.
        :return: A Player object.
        """
        return Player(player_dict['name'], player_dict['color'])
