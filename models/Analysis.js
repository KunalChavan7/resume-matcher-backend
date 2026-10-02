import mongoose from "mongoose";

const bulletSuggestionSchema = new mongoose.Schema(
  {
    original: { type: String, required: true },
    rewrite: { type: String, required: true },
  },
  { _id: false },
);

const analysisSchema = new mongoose.Schema(
  {
    jobTitle: { type: String, default: "" },
    matchScore: { type: Number, required: true, min: 0, max: 100 },
    matchedSkills: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    summary: { type: String, default: "" },
    bulletSuggestions: { type: [bulletSuggestionSchema], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model("Analysis", analysisSchema);