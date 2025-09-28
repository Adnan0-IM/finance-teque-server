const mongoose = require("mongoose");
const { ensureAdminUser, seedFakeUsers } = require("../utils/admin");

const connectDB = async () => {
  // Connect to MongoDB
  try {
      const connection = await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/finance-teque")
      console.log(`MongoDB Connected: ${connection.connection.host}`);

      // Seed an admin if configured
      await ensureAdminUser();
      await seedFakeUsers()

  } catch (error) {
      console.error("MongoDB connection error:", error) 
      throw new Error(`MongoDB connection error: ${error}`);
  }
};

module.exports = {connectDB}
