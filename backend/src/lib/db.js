import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export const connectDB = async () => {
  try {
    console.log("🔄 Attempting to connect to MongoDB...");
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✅ MongoDB connected successfully!");
    console.log("🔍 Connection State:", mongoose.connection.readyState); // 1 = Connected

    // ✅ Correct way to get Database Name
    console.log("🔍 Database Name:", mongoose.connection.db?.databaseName || "Database name not found");

    // 🔹 Get Connection String (useful for debugging)
    const client = mongoose.connection.getClient();
    console.log("🔍 Connected to MongoDB host:", client.s.url);

    // 🔹 Ensure full connection
    mongoose.connection.once("connected", () => {
      console.log("✅ Fully connected to MongoDB!");
      console.log("🔍 Host:", mongoose.connection.host || "Host info not available");
    });

  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
};
