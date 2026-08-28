const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    // Not required if using Google Login exclusively, but kept for email/pass auth
  },
  role: {
    type: String,
    enum: ['student', 'owner', 'admin'],
    default: 'student',
  },
  profileImage: {
    type: String,
    default: '',
  },
  firebaseUid: {
    type: String,
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;
