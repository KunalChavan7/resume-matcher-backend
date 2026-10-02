import express from "express";
import multer from "multer";
import { extractTextFromPdf } from "../services/pdfParser.js";
import { analyzeResumeAgainstJD } from "../services/llm.js";
import Analysis from "../models/Analysis.js";

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype !== "application/pdf") {
      return callback(new Error("File type is not supported"));
    }
    return callback(null, true);
  },
});

router.post("/analyze", upload.single("resumeFile"), async (req, res, next) => {
  try {
    const { resumeText, jdText, jobTitle } = req.body;
    if (!jdText?.trim()) {
      return res.status(400).json({ error: "Job description text is required." });
    }

    const finalResumeText = req.file
      ? await extractTextFromPdf(req.file.buffer)
      : resumeText?.trim();
    if (!finalResumeText) {
      return res.status(400).json({ error: "Resume text or a PDF file is required." });
    }

    const analysis = await analyzeResumeAgainstJD(finalResumeText, jdText);
    const response = {
      jobTitle: jobTitle?.trim() || "",
      matchScore: analysis.match_score,
      matchedSkills: analysis.matched_skills,
      missingSkills: analysis.missing_skills,
      summary: analysis.summary,
      bulletSuggestions: analysis.bullet_suggestions,
    };

    if (mongooseIsConnected()) {
      return res.json(await Analysis.create(response));
    }
    return res.json(response);
  } catch (error) {
    return next(error);
  }
});

router.get("/analyze/history", async (_req, res, next) => {
  try {
    if (!mongooseIsConnected()) {
      return res.json([]);
    }
    return res.json(await Analysis.find().sort({ createdAt: -1 }).limit(20));
  } catch (error) {
    return next(error);
  }
});

function mongooseIsConnected() {
  return Analysis.db.readyState === 1;
}

export default router;