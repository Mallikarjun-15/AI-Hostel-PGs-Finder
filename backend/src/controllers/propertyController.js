const Property = require('../models/Property');
const OpenAI = require('openai');
const { uploadToCloudinary } = require('../config/cloudinary');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// @desc    Get all properties (with optional filtering)
// @route   GET /api/properties
// @access  Public
const getProperties = async (req, res) => {
  try {
    const { keyword, minPrice, maxPrice, gender, roomType, location } = req.query;

    let query = { availability: true };

    if (keyword) {
      query.$or = [
        { title: { $regex: keyword, $options: 'i' } },
        { location: { $regex: keyword, $options: 'i' } },
      ];
    }
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }
    if (gender) query.gender = gender;
    if (roomType) query.roomType = roomType;
    if (location) query.location = { $regex: location, $options: 'i' };

    const properties = await Property.find(query).populate('ownerId', 'name email profileImage');
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get property by ID
// @route   GET /api/properties/:id
// @access  Public
const getPropertyById = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id).populate('ownerId', 'name email profileImage contact');
    if (property) {
      res.json(property);
    } else {
      res.status(404).json({ message: 'Property not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create a property
// @route   POST /api/properties
// @access  Private (Owner/Admin)
const createProperty = async (req, res) => {
  try {
    const {
      title,
      price,
      location,
      googleMapsLink,
      facilities, // Array or string
      ownerContact,
      roomType,
      gender,
      hasAC,
      hasWiFi,
      hasFood,
      hasAttachedBathroom,
      hasParking,
    } = req.body;

    let { description } = req.body;

    // Upload images to Cloudinary from memory buffer
    let images = [];
    if (req.files && req.files.length > 0) {
      images = await Promise.all(
        req.files.map((file) => uploadToCloudinary(file.buffer, file.mimetype))
      );
    }

    // Automatically generate room description if not provided or requested
    if (!description || description.trim() === '') {
      const facilityArray = Array.isArray(facilities) ? facilities : (facilities ? facilities.split(',') : []);
      const promptText = `Generate an attractive, concise listing description for a ${roomType} room in a PG/Hostel located in ${location}. It is for ${gender}. Facilities include: ${facilityArray.join(', ')}. Additional amenities: ${hasAC ? 'AC' : 'Non-AC'}, ${hasWiFi ? 'WiFi' : 'No WiFi'}, ${hasFood ? 'Food included' : 'No food'}, ${hasAttachedBathroom ? 'Attached bathroom' : 'Shared bathroom'}, ${hasParking ? 'Parking' : 'No parking'}. Price: ₹${price}. Keep it around 2-3 sentences.`;

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-3.5-turbo",
          messages: [{ role: "user", content: promptText }],
          max_tokens: 150,
        });
        description = response.choices[0].message.content.trim();
      } catch (aiError) {
        console.log('OpenAI quota exceeded or API failed, using fallback description.');
        description = `A great ${roomType} room in ${location}.`; // Fallback description
      }
    }

    let assignedOwnerId = req.user._id;
    if (req.user.role === 'admin' && req.body.ownerId) {
      assignedOwnerId = req.body.ownerId;
    }

    const property = new Property({
      title,
      description,
      price,
      location,
      googleMapsLink,
      facilities: Array.isArray(facilities) ? facilities : (facilities ? facilities.split(',') : []),
      images,
      ownerContact,
      ownerId: assignedOwnerId,
      roomType,
      gender,
      hasAC: hasAC === 'true',
      hasWiFi: hasWiFi === 'true',
      hasFood: hasFood === 'true',
      hasAttachedBathroom: hasAttachedBathroom === 'true',
      hasParking: hasParking === 'true',
    });

    const createdProperty = await property.save();
    res.status(201).json(createdProperty);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update a property
// @route   PUT /api/properties/:id
// @access  Private (Owner/Admin)
const updateProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (property) {
      // Check ownership
      if (property.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
         return res.status(401).json({ message: 'Not authorized to update this property' });
      }

      property.title = req.body.title || property.title;
      property.description = req.body.description || property.description;
      property.price = req.body.price || property.price;
      property.location = req.body.location || property.location;
      property.availability = req.body.availability !== undefined ? req.body.availability : property.availability;
      
      const updatedProperty = await property.save();
      res.json(updatedProperty);
    } else {
      res.status(404).json({ message: 'Property not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Delete a property
// @route   DELETE /api/properties/:id
// @access  Private (Owner/Admin)
const deleteProperty = async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);

    if (property) {
      if (property.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
         return res.status(401).json({ message: 'Not authorized to delete this property' });
      }
      await property.deleteOne();
      res.json({ message: 'Property removed' });
    } else {
      res.status(404).json({ message: 'Property not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get properties owned by logged-in user
// @route   GET /api/properties/my
// @access  Private (Owner)
const getMyProperties = async (req, res) => {
  try {
    const properties = await Property.find({ ownerId: req.user._id });
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get ALL properties (admin only, no availability filter)
// @route   GET /api/properties/admin/all
// @access  Private/Admin
const getAdminProperties = async (req, res) => {
  try {
    const properties = await Property.find({}).populate('ownerId', 'name email profileImage');
    res.json(properties);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
  getMyProperties,
  getAdminProperties,
};
