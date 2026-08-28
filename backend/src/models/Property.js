const mongoose = require('mongoose');

const propertySchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  googleMapsLink: {
    type: String,
  },
  facilities: [{
    type: String,
  }],
  images: [{
    type: String,
  }],
  ownerContact: {
    type: String,
    required: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  roomType: {
    type: String,
    enum: ['Single', 'Double', 'Triple', 'Dormitory'],
    default: 'Single',
  },
  gender: {
    type: String,
    enum: ['Boys', 'Girls', 'Unisex'],
    required: true,
  },
  hasAC: {
    type: Boolean,
    default: false,
  },
  hasWiFi: {
    type: Boolean,
    default: false,
  },
  hasFood: {
    type: Boolean,
    default: false,
  },
  hasAttachedBathroom: {
    type: Boolean,
    default: false,
  },
  hasParking: {
    type: Boolean,
    default: false,
  },
  availability: {
    type: Boolean,
    default: true,
  },
  ratings: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: Number,
    review: String,
  }],
}, { timestamps: true });

const Property = mongoose.model('Property', propertySchema);
module.exports = Property;
