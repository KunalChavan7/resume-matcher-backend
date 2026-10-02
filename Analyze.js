import express from "express";
import multer from "multer";
import { extractTextFromPdf } from "../services/pdfParser.js";
import { analyzeResumeAgainstJD } from "../services/llm.js";
import Analysis from "../models/Analysis.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/analyze
// Accepts either a PDF file (field: "resumeFile") OR plain text (field: "resumeText"),
// plus job description text (field: "jdText") and optional "jobTitle".
router.post("/analyze", upload.single("resumeFile"), async (req, res) => {
  try {
    const { resumeText, jdText, jobTitle } = req.body;

    if (!jdText || !jdText.trim()) {
      return res.status(400).json({ error: "Job description text is required." });
    }

    let finalResumeText = resumeText;
    if (req.file) {
      finalResumeText = await extractTextFromPdf(req.file.buffer);
    }

    if (!finalResumeText || !finalResumeText.trim()) {
      return res.status(400).json({ error: "Resume text or file is required." });
    }

    const analysis = await analyzeResumeAgainstJD(finalResumeText, jdText);

    const saved = await Analysis.create({
      jobTitle: jobTitle || "",
      matchScore: analysis.match_score,
      matchedSkills: analysis.matched_skills,
      missingSkills: analysis.missing_skills,
      summary: analysis.summary,
      bulletSuggestions: analysis.bullet_suggestions,
    });

    res.json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || "Something went wrong." });
  }
});

// GET /api/analyze/history
router.get("/analyze/history", async (req, res) => {
  const history = await Analysis.find().sort({ createdAt: -1 }).limit(20);
  res.json(history);
});

export default router;