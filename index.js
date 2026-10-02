import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import analyzeRoutes from "./routes/analyze.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", analyzeRoutes);

app.use((error, _req, res, _next) => {
  if (error instanceof mongoose.Error) {
    return res.status(400).json({ error: error.message });
  }
  if (error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "Resume PDF must be 5 MB or smaller." });
  }
  if (error.message === "File type is not supported") {
    return res.status(400).json({ error: error.message });
  }
  console.error(error);
  return res.status(500).json({ error: error.message || "Something went wrong." });
});

app.get("/", (req, res) => {
  res.json({ status: "Resume Matcher API running" });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  if (process.env.MONGODB_URI) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log("MongoDB connected");
    } catch (error) {
      console.error("MongoDB connection failed:", error.message);
    }
  } else {
    console.log("MONGODB_URI not configured; analyses will not be persisted.");
  }

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

startServer();