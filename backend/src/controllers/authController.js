const User = require('../models/User');
const jwt = require('jsonwebtoken');
const admin = require('../config/firebase');
const bcrypt = require('bcryptjs');

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'your_jwt_secret_key_here', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user (Standard Email/Password)
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please add all fields' });
    }

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        token: generateToken(user._id, user.role),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Auth user & get token (Standard Email/Password OR Firebase)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  const { email, password, firebaseToken, role } = req.body;

  try {
    // 1. Firebase Login Path
    if (firebaseToken) {
      const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
      const { uid, email: fbEmail, name, picture } = decodedToken;

      let user = await User.findOne({ email: fbEmail });

      if (!user) {
        user = await User.create({
          name: name || fbEmail.split('@')[0],
          email: fbEmail,
          firebaseUid: uid,
          profileImage: picture || '',
          role: role || 'student',
        });
      } else if (role && user.role !== role) {
        return res.status(401).json({ 
          message: `Access denied. This account is not registered as ${role.charAt(0).toUpperCase() + role.slice(1)}.` 
        });
      }

      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        token: generateToken(user._id, user.role),
      });
    }

    // 2. Standard Email/Password Login Path
    if (email && password) {
      const user = await User.findOne({ email });

      if (user && user.password && (await bcrypt.compare(password, user.password))) {
        if (role && user.role !== role) {
          return res.status(401).json({ 
            message: `Access denied. This account is not registered as ${role.charAt(0).toUpperCase() + role.slice(1)}.` 
          });
        }

        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          profileImage: user.profileImage,
          token: generateToken(user._id, user.role),
        });
      } else {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    }

    res.status(400).json({ message: 'Please provide email and password or a valid firebase token' });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(401).json({ message: 'Authentication failed' });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
};
