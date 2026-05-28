// db/connectDb.js  — drop-in replacement, same path as your original

import mongoose from "mongoose";

const connectDb = async () => {
  // Already connected
  if (mongoose.connection.readyState === 1) return;

  // Connecting in progress — wait for it
  if (mongoose.connection.readyState === 2) {
    await new Promise((resolve) => mongoose.connection.once("open", resolve));
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error; // let the API route return a real 500 message
  }
};

export default connectDb;