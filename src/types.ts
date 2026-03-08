export interface RecruiterInfo {
  name: string;
  email: string;
  linkedin: string;
  company: string;
  phone?: string;
}

export interface MatchAnalysis {
  score: number;
  label: string;
  breakdown: {
    experience: number;
    skills: number;
    industry: number;
    seniority: number;
    tools: number;
  };
  missingSkills: string[];
  matchingStrengths: string[];
  recommendation: string;
  cultureFit?: string;
}

export interface Vacancy {
  id: string;
  title: string;
  company: string;
  location: string;
  modality: string;
  contractType: string;
  salary: string;
  publishedDate: string;
  applicationLink: string;
  description: string;
  requirements: string[];
  stack: string[];
  recruiter: RecruiterInfo;
  matchAnalysis?: MatchAnalysis;
  companyInsights?: string;
  mappedPortals?: string[];
}

export interface ParsedCV {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  summary: string;
  experience: any[];
  education: any[];
  skills: string[];
  softSkills: string[];
  metrics: string[];
  englishLevel: string;
  sectors: string[];
  seniority: string;
  rawText: string;
}
