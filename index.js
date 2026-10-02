import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import analyzeRoutes from "./routes/analyze.js";

dotenv.config();

const app = express();

// Only these origins are allowed to call this API.
// Add more here later (e.g. a custom domain) if you connect one.
const allowedOrigins = [
  "https://resume-matcher-frontend-smoky.vercel.app",
  "http://localhost:5173", // local dev
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like curl, Postman, or server-to-server)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);
app.use(express.json());

app.use("/api", analyzeRoutes);

app.get("/", (req, res) => {
  res.json({ status: "Resume Matcher API running" });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
  });