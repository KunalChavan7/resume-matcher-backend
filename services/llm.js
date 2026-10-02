import Groq from "groq-sdk";

const SYSTEM_PROMPT = `You compare a resume to a job description for a candidate.
Return only valid JSON with this exact shape:
{
  "match_score": number,
  "matched_skills": string[],
  "missing_skills": string[],
  "summary": string,
  "bullet_suggestions": [{ "original": string, "rewrite": string }]
}

Rules:
- match_score must be an integer from 0 to 100.
- Use this scoring rubric consistently:
  90-100: Nearly all core requirements are met; only minor gaps.
  70-89: Most core requirements are met; a few notable gaps.
  50-69: Some core requirements are met; several significant gaps.
  30-49: Few core requirements are met; major gaps.
  0-29: Little to no relevant alignment.
- Weigh core requirements more heavily than nice-to-haves and assess the same evidence against the same rubric each time.
- Use concise skill names in the skill arrays and do not invent resume experience.
- Return exactly 3 bullet_suggestions when the resume contains enough bullets; otherwise return as many as can be grounded in the resume.
- Each rewrite must remain truthful to the resume and align with the job description.
- Do not include markdown fences or any text outside the JSON object.`;

export async function analyzeResumeAgainstJD(resumeText, jdText) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
    temperature: 0,
    seed: 42,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `RESUME:\n${resumeText.trim()}\n\nJOB DESCRIPTION:\n${jdText.trim()}`,
      },
    ],
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("The LLM returned an empty response.");
  }

  const result = JSON.parse(content);
  return normalizeAnalysis(result);
}

function normalizeAnalysis(result) {
  const score = Number(result.match_score);
  if (!Number.isFinite(score)) {
    throw new Error("The LLM returned an invalid match score.");
  }

  return {
    match_score: Math.max(0, Math.min(100, Math.round(score))),
    matched_skills: toStringArray(result.matched_skills),
    missing_skills: toStringArray(result.missing_skills),
    summary: typeof result.summary === "string" ? result.summary.trim() : "",
    bullet_suggestions: Array.isArray(result.bullet_suggestions)
      ? result.bullet_suggestions
          .filter((item) => item && typeof item === "object")
          .map((item) => ({
            original: String(item.original || "").trim(),
            rewrite: String(item.rewrite || "").trim(),
          }))
          .filter((item) => item.original && item.rewrite)
      : [],
  };
}

function toStringArray(value) {
  return Array.isArray(value)
    ? value.filter((item) => typeof item === "string").map((item) => item.trim()).filter(Boolean)
    : [];
}