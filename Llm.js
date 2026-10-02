import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// This is the core prompt. Keep it strict so the model returns clean JSON
// you can parse directly — never rely on regex to pull fields out of free text.
const SYSTEM_PROMPT = `You are an expert technical recruiter and resume reviewer.
You will be given a candidate's RESUME and a JOB DESCRIPTION.

Compare them carefully and respond with ONLY a valid JSON object — no markdown
fences, no preamble, no explanation outside the JSON. The JSON must match this
exact shape:

{
  "match_score": <integer 0-100, how well the resume fits the JD>,
  "matched_skills": [<array of strings — skills/keywords present in both>],
  "missing_skills": [<array of strings — important JD skills/keywords absent from resume>],
  "summary": "<1-2 sentence plain-language verdict>",
  "bullet_suggestions": [
    {
      "original": "<a real bullet point from the resume, verbatim>",
      "improved": "<rewritten version that better targets the JD, same underlying facts, no invented experience>"
    }
  ]
}

Rules:
- match_score should reflect real alignment, not just keyword overlap — weigh core requirements more than nice-to-haves.
- Never invent skills, companies, or experience the candidate doesn't have.
- bullet_suggestions must reference bullets that actually exist in the resume text — pick 2-3 of the weakest/most improvable ones.
- Keep missing_skills focused on skills that are genuinely important in the JD, not every minor keyword.`;

/**
 * Sends resume + JD text to the LLM and returns parsed JSON analysis.
 */
export async function analyzeResumeAgainstJD(resumeText, jdText) {
  const userPrompt = `RESUME:\n"""${resumeText}"""\n\nJOB DESCRIPTION:\n"""${jdText}"""`;

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile", // check console.groq.com for current available models
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3, // lower temperature = more consistent scoring
    response_format: { type: "json_object" }, // forces valid JSON output
  });

  const raw = completion.choices[0].message.content;

  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error("Model did not return valid JSON. Raw response: " + raw);
  }
}