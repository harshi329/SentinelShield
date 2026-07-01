// Load env vars FIRST before anything else is imported
import dotenv from "dotenv";
dotenv.config();

import connectDB from "./config/db";
import app from "./app";

// =======================
// Database Connection
// =======================
connectDB();

// =======================
// Start Server
// =======================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📧 Email user: ${process.env.EMAIL_USER ? "✅ Set" : "❌ NOT SET"}`);
  console.log(`🔑 JWT secret: ${process.env.JWT_SECRET ? "✅ Set" : "❌ NOT SET"}`);
  console.log(`🗄️  Mongo URI: ${process.env.MONGO_URI ? "✅ Set" : "❌ NOT SET"}`);
});
