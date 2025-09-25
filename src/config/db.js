const mongoose = require("mongoose");
const { ensureAdminUser } = require("../utils/admin");

function connectDB() {
  // Connect to MongoDB
  mongoose
    .connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/finance-teque",
    )
    .then(async () => {
      console.log("MongoDB Connected");
      // Seed an admin if configured
      await ensureAdminUser();
    })
    .catch((err) => console.error("MongoDB connection error:", err));
};

module.exports = {connectDB}