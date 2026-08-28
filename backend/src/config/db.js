const mongoose = require('mongoose');

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
    } catch (memError) {
      console.error(`Failed to start in-memory MongoDB: ${memError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
