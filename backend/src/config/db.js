const mongoose = require('mongoose');

const seedDatabase = async () => {
  try {
    const User = require('../models/User');
    const Property = require('../models/Property');
    const bcrypt = require('bcryptjs');

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Seeding default test accounts...');
      
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);

      // Seed Student
      const student = await User.create({
        name: 'Test Student',
        email: 'student@example.com',
        password: hashedPassword,
        role: 'student',
      });

      // Seed Owner
      const owner = await User.create({
        name: 'Test Owner',
        email: 'owner@example.com',
        password: hashedPassword,
        role: 'owner',
      });

      // Seed Admin
      const admin = await User.create({
        name: 'Test Admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
      });

      console.log('Test accounts seeded successfully:');
      console.log('  Student: student@example.com / password123');
      console.log('  Owner:   owner@example.com / password123');
      console.log('  Admin:   admin@example.com / password123');

      // Seed dummy properties
      const propertyCount = await Property.countDocuments();
      if (propertyCount === 0) {
        console.log('Seeding sample properties...');
        await Property.create([
          {
            title: 'Cozy Single Room PG near College',
            description: 'A beautiful single room PG situated in a quiet neighborhood. Perfect for students who want a peaceful study environment.',
            price: 6500,
            location: 'Koramangala, Bangalore',
            googleMapsLink: 'https://maps.google.com',
            facilities: ['Laundry', 'Gym', '24/7 Security'],
            images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'],
            ownerContact: '+91 98765 43210',
            ownerId: owner._id,
            roomType: 'Single',
            gender: 'Boys',
            hasAC: true,
            hasWiFi: true,
            hasFood: true,
            hasAttachedBathroom: true,
            hasParking: true,
            availability: true,
          },
          {
            title: 'Modern Double Sharing PG for Girls',
            description: 'Fully furnished double sharing room with all modern amenities. Located close to the metro station.',
            price: 5000,
            location: 'Indiranagar, Bangalore',
            googleMapsLink: 'https://maps.google.com',
            facilities: ['Housekeeping', 'Power Backup', 'CCTV'],
            images: ['https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=800&q=80'],
            ownerContact: '+91 98765 43210',
            ownerId: owner._id,
            roomType: 'Double',
            gender: 'Girls',
            hasAC: false,
            hasWiFi: true,
            hasFood: true,
            hasAttachedBathroom: false,
            hasParking: false,
            availability: true,
          }
        ]);
        console.log('Sample properties seeded successfully.');
      }
    }
  } catch (error) {
    console.error('Error seeding database:', error);
  }
};

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/stayfinder';
  
  try {
    console.log(`Attempting to connect to MongoDB...`);
    const conn = await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle intermittent connection errors after initial connection
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });

    // Seed database if empty
    await seedDatabase();
  } catch (error) {
    console.warn(`Could not connect to MongoDB at ${mongoUri}: ${error.message}`);
    console.warn(`Starting in-memory MongoDB server as fallback...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      const fallbackUri = mongoServer.getUri();
      console.log(`In-memory MongoDB server started at: ${fallbackUri}`);
      
      const conn = await mongoose.connect(fallbackUri);
      console.log(`MongoDB Connected to In-Memory DB: ${conn.connection.host}`);
      
      mongoose.connection.on('error', err => {
        console.error('In-memory MongoDB connection error:', err);
      });

      // Seed database if empty
      await seedDatabase();
    } catch (memError) {
      console.error(`Failed to start in-memory MongoDB: ${memError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;

