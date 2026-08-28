const Favorite = require('../models/Favorite');
const Property = require('../models/Property');

// @desc    Get all favorites for the logged-in user
// @route   GET /api/favorites
// @access  Private
const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ userId: req.user._id })
      .populate('propertyId')
      .sort({ createdAt: -1 });

    // Filter out any favorites where the property was deleted
    const validFavorites = favorites.filter(f => f.propertyId);
    res.json(validFavorites.map(f => f.propertyId));
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Add a property to favorites
// @route   POST /api/favorites/:propertyId
// @access  Private
const addFavorite = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const property = await Property.findById(propertyId);
    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const existing = await Favorite.findOne({ userId: req.user._id, propertyId });
    if (existing) {
      return res.status(400).json({ message: 'Already in favorites' });
    }

    const favorite = await Favorite.create({ userId: req.user._id, propertyId });
    res.status(201).json({ message: 'Added to favorites', favorite });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Remove a property from favorites
// @route   DELETE /api/favorites/:propertyId
// @access  Private
const removeFavorite = async (req, res) => {
  try {
    const { propertyId } = req.params;

    const favorite = await Favorite.findOneAndDelete({
      userId: req.user._id,
      propertyId,
    });

    if (!favorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    res.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Check if a property is favorited by the user
// @route   GET /api/favorites/check/:propertyId
// @access  Private
const checkFavorite = async (req, res) => {
  try {
    const { propertyId } = req.params;
    const favorite = await Favorite.findOne({ userId: req.user._id, propertyId });
    res.json({ isFavorite: !!favorite });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = { getFavorites, addFavorite, removeFavorite, checkFavorite };
