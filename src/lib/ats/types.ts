export interface ExtractedResumeData {
  text: string;
  pageCount: number;
  wordCount: number;
  characterCount: number;
  lines: string[];
  fileName: string;
  fileSize: number;
  fileType: 'pdf' | 'docx';
}

export type ScoreImpact = 'high' | 'medium' | 'low';
export type IssueType = 'critical' | 'warning' | 'pass';

export interface SuggestionItem {
  id: string;
  category: 'layout' | 'contact' | 'sections' | 'impact' | 'skills';
  type: IssueType;
  impact: ScoreImpact;
  title: string;
  issue: string;
  fix: string;
  example?: string;
}

export interface CategoryScore {
  id: 'layout' | 'contact' | 'sections' | 'impact' | 'skills';
  name: string;
  score: number;
  maxScore: number;
  weight: ScoreImpact;
  status: 'excellent' | 'good' | 'needs-work' | 'critical';
  summary: string;
}

export interface AtsSystemAudit {
  system: 'Workday' | 'Greenhouse' | 'Lever' | 'Ashby';
  status: 'pass' | 'warning' | 'fail';
  summary: string;
  detail: string;
}

export interface DetectedSkillGroup {
  category: string;
  skills: string[];
}

export interface MatchedJob {
  id: string;
  slug: string;
  title: string;
  company: string;
  location: string;
  region: string;
  tags: string[];
  applyUrl: string;
  matchingSkills: string[];
}

export interface AtsScoreResult {
  overallScore: number;
  verdict: {
    label: string;
    tier: 'excellent' | 'good' | 'warning' | 'danger';
    color: string;
    summary: string;
  };
  metrics: {
    wordCount: number;
    pageCount: number;
    actionVerbCount: number;
    quantifiableMetricCount: number;
    detectedSkillCount: number;
  };
  categories: CategoryScore[];
  suggestions: SuggestionItem[];
  atsSystems: AtsSystemAudit[];
  detectedSkills: DetectedSkillGroup[];
  matchedJobs: MatchedJob[];
  extractedTextPreview: string;
}
