export type StudentProfile = { name: string; university: string; study: string; graduationYear: string };
export type Score = { value: number; label: string; detail: string };
export type ResumeReview = {
  overallScore: number;
  scores: Score[];
  summary: string;
  strengths: string[];
  matchingSkills: string[];
  missingSkills: string[];
  recommendations: string[];
  tailoredResume: string;
  coverLetter: string;
};
