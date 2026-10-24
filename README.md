# Portal

Portal is a student career studio for reviewing a resume against a role, understanding strengths and skill gaps, and preparing a tailored resume and cover letter draft.

## What’s included

- Google sign-in with Firebase Authentication.
- A lightweight student profile saved in that student's browser.
- PDF, DOCX, and TXT resume uploads (up to 5 MB).
- Role readiness, resume clarity, evidence, and skill coverage feedback.
- Job-specific strengths, matching skills, growth areas, and practical suggestions.
- Downloadable tailored resume and cover letter drafts.
- Authenticated Express API with in-memory file parsing, Firebase token verification, rate limiting, upload limits, and security headers.

Scores are coaching estimates based on the supplied documents. They are not hiring predictions, guarantees, or a substitute for checking generated drafts for accuracy.

## Run locally

Requirements: Node.js 20 or newer, a Firebase project with Google sign-in enabled, and an OpenAI API key for the review endpoint.

1. Copy .env.example to .env.
2. In Firebase Console, create a Web app and add the API key, Auth domain, Project ID, and App ID as the four VITE_FIREBASE_* values.
3. Enable Authentication > Sign-in method > Google in Firebase. Add localhost to the authorized domains for development.
4. Create a Firebase service account for the server. Set FIREBASE_SERVICE_ACCOUNT_JSON to its JSON contents on one line. Keep this credential private.
5. Set OPENAI_API_KEY. OPENAI_MODEL defaults to gpt-4o-mini.
6. Run npm install, then npm run dev. The web app runs at http://localhost:5173 and the API at http://localhost:3001.

The Firebase web configuration is public client configuration; the service account and OpenAI key are secrets. Do not commit .env or paste server credentials into VITE_* variables.

## Production deployment

Deploy on Render with the included `render.yaml` Blueprint. Connect this repository and deploy the Blueprint; Render will build the Vite frontend and serve it with the Express API from one web service. Add the four Firebase web-app values, Firebase service account, and OpenAI API key in Render when prompted. Add the generated `onrender.com` domain to Firebase Authentication's authorized domains. Keep the service account and OpenAI key in Render's secret environment fields, never in the repository.

The generated drafts may contain personal details from a resume. Review the privacy and retention terms of your chosen AI provider and hosting provider before accepting real student resumes. This starter does not add a database or persist uploaded files.

## Privacy and limitations

- Resume bytes are parsed in process memory, never written to disk or a database by Portal.
- Extracted resume text and the job description are sent to the configured OpenAI API to produce feedback. Configure provider and hosting policies before production use.
- Profile fields are saved in the signed-in student's browser only; they are not synced across devices.
- Scanned/image-only PDFs may need OCR; the app reports when it cannot extract enough text.
- Users should verify every generated statement and should not add skills they have not learned.
