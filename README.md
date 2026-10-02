# Resume Matcher Backend

Express API that compares resume text or a PDF resume with a job description using Groq structured JSON output.

## Setup

```powershell
cd resume-matcher-backend
npm install
Copy-Item .env.example .env
```

Set `GROQ_API_KEY` and `MONGODB_URI` in `.env`.

For MongoDB Atlas, copy the connection string from **Connect > Drivers**, replace the username and password with the Atlas database user's credentials, and remove any `<` or `>` characters used to mark placeholders. URL-encode special password characters such as `@`, `:`, `/`, and `#`. Also add your current IP address under **Network Access** in Atlas. The backend stores analyses in MongoDB when the connection succeeds; otherwise it starts in non-persistent mode and logs the connection error.

Example format:

```text
MONGODB_URI=mongodb+srv://database_user:encoded_password@cluster0.example.mongodb.net/resume_matcher
```

## Run

```powershell
npm run dev
```

The API starts at `http://localhost:5000`.

## Analyze text

```powershell
curl.exe -X POST http://localhost:5000/api/analyze `
  -F "resumeText=Built a MERN e-commerce app with JWT authentication" `
  -F "jdText=Looking for a Node.js developer with React and MongoDB experience" `
  -F "jobTitle=Full Stack Developer"
```

## Analyze a PDF

```powershell
curl.exe -X POST http://localhost:5000/api/analyze `
  -F "resumeFile=@C:\path\to\resume.pdf" `
  -F "jdText=Looking for a Node.js developer with React and MongoDB experience"
```

The PDF upload limit is 5 MB. The API returns `matchScore`, matched and missing skills, a summary, and grounded bullet rewrite suggestions.

## Endpoints

- `GET /` health check
- `POST /api/analyze` analyze pasted text or a PDF upload
- `GET /api/analyze/history` return the latest 20 saved analyses