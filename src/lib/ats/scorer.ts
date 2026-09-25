import type {
  ExtractedResumeData,
  AtsScoreResult,
  SuggestionItem,
  CategoryScore,
  AtsSystemAudit,
} from './types';
import { extractSkillsFromText, matchJobsForSkills } from './skills-matcher';

// High-impact action verbs favored by engineering hiring managers and ATS semantic parsers
const STRONG_ACTION_VERBS = [
  'architected', 'engineered', 'spearheaded', 'designed', 'developed', 'deployed',
  'optimized', 'refactored', 'scaled', 'accelerated', 'automated', 'orchestrated',
  'implemented', 'built', 'reduced', 'increased', 'eliminated', 'migrated',
  'mentored', 'streamlined', 'delivered', 'overhauled', 'boosted', 'secured'
];

// Passive or weak phrases that lower score
const WEAK_PASSIVE_PHRASES = [
  'responsible for', 'duties included', 'worked on', 'helped with', 'assisted in',
  'part of a team that', 'handled daily tasks', 'familiar with', 'involved in'
];

export function calculateAtsScore(resume: ExtractedResumeData): AtsScoreResult {
  const text = resume.text;
  const lowerText = text.toLowerCase();
  const suggestions: SuggestionItem[] = [];

  // ============================================================================
  // 1. Layout & ATS Parseability (25 pts)
  // ============================================================================
  let layoutScore = 25;
  const layoutIssues: string[] = [];

  // 1.1 Word Count Checks
  if (resume.wordCount < 200) {
    layoutScore -= 12;
    suggestions.push({
      id: 'word-count-critical',
      category: 'layout',
      type: 'critical',
      impact: 'high',
      title: 'Resume is too short (< 200 words)',
      issue: `Your resume contains only ${resume.wordCount} words, which triggers auto-rejection by ATS semantic filters as an incomplete profile.`,
      fix: 'Expand your experience bullet points with detailed technical achievements and architecture decisions (aim for 450–900 words).',
    });
  } else if (resume.wordCount < 350) {
    layoutScore -= 5;
    suggestions.push({
      id: 'word-count-low',
      category: 'layout',
      type: 'warning',
      impact: 'medium',
      title: 'Word count is on the lower side',
      issue: `Current word count is ${resume.wordCount}. Senior engineering resumes typically average 500–1,000 words.`,
      fix: 'Add more engineering war stories, architectural decisions, and production metrics to each role.',
    });
  } else if (resume.wordCount > 1800) {
    layoutScore -= 6;
    suggestions.push({
      id: 'word-count-high',
      category: 'layout',
      type: 'warning',
      impact: 'medium',
      title: 'Resume is excessively long (> 1,800 words)',
      issue: `Your resume is approximately ${resume.wordCount} words (~3–4+ pages). Recruiters spend only 6–10 seconds per scan.`,
      fix: 'Condense roles older than 5–7 years to 1–2 bullet points each. Keep total length to 1–2 pages max.',
    });
  }

  // 1.2 Multi-column layout heuristic
  // In single-column text, lines have fairly uniform progression.
  // In multi-column extractions, short disconnected lines occur frequently side-by-side.
  // Filter out standard section headers, dates, and names before checking short line ratio
  const headerOrDatePattern = /^(professional\s+summary|technical\s+skills|professional\s+experience|experience|education|projects?|personal\s+projects?|skills|work\s+experience|certifications?|\w+\s+\d{4}|\d{4}\s*[-–]\s*\w+|\w+\s*,\s*\w+|\+\d+)/i;
  const nonHeaderLines = resume.lines.filter((l) => !headerOrDatePattern.test(l.trim()));
  const shortLines = nonHeaderLines.filter((l) => l.split(/\s+/).length <= 3 && l.length > 3);
  const shortLineRatio = nonHeaderLines.length > 0 ? shortLines.length / nonHeaderLines.length : 0;

  if (shortLineRatio > 0.35 && resume.fileType === 'pdf') {
    layoutScore -= 3;
    suggestions.push({
      id: 'multi-column-detected',
      category: 'layout',
      type: 'warning',
      impact: 'medium',
      title: 'Side-by-Side Column / Sidebar Layout Detected',
      issue: 'Text layer analysis indicates a partial multi-column or sidebar layout (e.g. competencies or skills alongside summary/experience). Legacy enterprise parsers (like older Workday instances) read text strictly horizontally across the page, which can mix sidebar bullets into job descriptions.',
      fix: 'For maximum enterprise ATS safety, arrange all content in a single-column, top-to-bottom linear flow.',
      example: 'Place "Technical Skills" in a horizontal block below the summary rather than in a side-by-side vertical column.',
    });
  }

  // 1.3 File Name Hygiene
  const badFileNamePatterns = [/final/i, /draft/i, /copy/i, /v\d+/i, /[_\s]{2,}/];
  if (badFileNamePatterns.some((p) => p.test(resume.fileName))) {
    layoutScore -= 3;
    suggestions.push({
      id: 'file-name-hygiene',
      category: 'layout',
      type: 'warning',
      impact: 'low',
      title: 'File naming contains version tags',
      issue: `Your file name "${resume.fileName}" contains internal draft labels or version tags.`,
      fix: 'Rename your file using the industry standard format: "FirstName_LastName_Resume.pdf" (e.g. "Alex_Chen_Senior_Frontend_Engineer.pdf").',
    });
  }

  layoutScore = Math.max(0, Math.min(25, layoutScore));

  // ============================================================================
  // 2. Contact & Profile Completeness (15 pts)
  // ============================================================================
  let contactScore = 15;

  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
  const phoneRegex = /(?:(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\+?\d{10,14})/;
  const linkedinUrlRegex = /(?:linkedin\.com\/(?:in|pub)\/|[a-zA-Z0-9-]+\s*\/\s*linkedin)/i;
  const githubUrlRegex = /(?:github\.com\/[a-zA-Z0-9_-]+|gitlab\.com\/[a-zA-Z0-9_-]+)/i;
  const linkedinMentionRegex = /\blinkedin\b/i;
  const githubMentionRegex = /\b(github|gitlab)\b/i;
  const locationRegex = /\b([A-Z][a-zA-Z\s]+,\s*([A-Z]{2}|[A-Za-z\s]+)|Remote|USA|United States|India|Bangalore|Bengaluru|Chennai|Hyderabad|Mumbai|Delhi|London|Canada|UK|United Kingdom|Germany|Europe|Worldwide)\b/i;

  const hasEmail = emailRegex.test(text);
  const hasPhone = phoneRegex.test(text);
  const hasLinkedinUrl = linkedinUrlRegex.test(text);
  const hasGithubUrl = githubUrlRegex.test(text);
  const hasLinkedinMention = linkedinMentionRegex.test(text);
  const hasGithubMention = githubMentionRegex.test(text);

  const hasLinkedin = hasLinkedinUrl || hasLinkedinMention;
  const hasGithub = hasGithubUrl || hasGithubMention;
  const hasLocation = locationRegex.test(text);

  if (!hasEmail) {
    contactScore -= 6;
    suggestions.push({
      id: 'missing-email',
      category: 'contact',
      type: 'critical',
      impact: 'high',
      title: 'No Email Address Detected',
      issue: 'ATS could not extract a valid email address. If your email is inside an image or document header, ATS parsers strip it.',
      fix: 'Place your email in plain text in the top contact block (e.g., alex@example.com). Do NOT put it inside header/footer margins.',
    });
  }

  if (!hasPhone) {
    contactScore -= 3;
    suggestions.push({
      id: 'missing-phone',
      category: 'contact',
      type: 'warning',
      impact: 'medium',
      title: 'No Phone Number Detected',
      issue: 'A standard telephone or mobile number was not recognized in the parsed text.',
      fix: 'Include a contact number with international dial code (e.g. +1 555-019-2834 or +91 98765 43210).',
    });
  }

  if (!hasLinkedin && !hasGithub) {
    contactScore -= 4;
    suggestions.push({
      id: 'missing-social-links',
      category: 'contact',
      type: 'warning',
      impact: 'medium',
      title: 'Missing LinkedIn or GitHub Profiles',
      issue: 'Senior developer profiles expect clickable URLs to your LinkedIn or public code repository.',
      fix: 'Add plain-text links: linkedin.com/in/yourprofile and github.com/yourusername.',
    });
  } else if ((hasLinkedinMention && !hasLinkedinUrl) || (hasGithubMention && !hasGithubUrl)) {
    contactScore -= 2;
    suggestions.push({
      id: 'embed-plain-text-urls',
      category: 'contact',
      type: 'warning',
      impact: 'low',
      title: 'Display Full LinkedIn / GitHub URLs in Plain Text',
      issue: 'Your profile links were detected as anchor text ("LinkedIn", "GitHub"). Legacy enterprise parsers (like older Workday versions) discard embedded PDF hyperlinks.',
      fix: 'Write out the full URL string (e.g. "linkedin.com/in/santhanakrishnan") next to the anchor text.',
    });
  }

  if (!hasLocation) {
    contactScore -= 2;
    suggestions.push({
      id: 'missing-location',
      category: 'contact',
      type: 'warning',
      impact: 'low',
      title: 'No Location / Country Specified',
      issue: 'Many remote ATS filters require a country or city to determine payroll/tax eligibility (e.g. "Remote (US)", "London, UK").',
      fix: 'Add your city, state/country, or "Remote (Worldwide)" under your name.',
    });
  }

  contactScore = Math.max(0, Math.min(15, contactScore));

  // ============================================================================
  // 3. Core Section Structure (20 pts)
  // ============================================================================
  let sectionScore = 20;

  const hasExperience = /\b(experience|work history|employment|professional background|work experience)\b/i.test(text);
  const hasEducation = /\b(education|academic background|university|degree|bachelor|master|phd)\b/i.test(text);
  const hasSkills = /\b(skills|technical skills|technologies|tech stack|competencies|core skills)\b/i.test(text);
  const hasProjects = /\b(projects?|personal projects?|open source|key projects?|portfolio|side projects?|featured projects?)\b/i.test(text);

  if (!hasExperience) {
    sectionScore -= 8;
    suggestions.push({
      id: 'missing-experience-header',
      category: 'sections',
      type: 'critical',
      impact: 'high',
      title: 'Standard "Experience" Header Missing',
      issue: 'ATS bots rely on standard keywords like "Experience" or "Work Experience" to build your chronological job timeline.',
      fix: 'Use the standard H2 header "Work Experience" or "Professional Experience". Avoid creative titles like "Where I\'ve Been".',
    });
  }

  if (!hasSkills) {
    sectionScore -= 5;
    suggestions.push({
      id: 'missing-skills-section',
      category: 'sections',
      type: 'critical',
      impact: 'high',
      title: 'Dedicated "Technical Skills" Section Missing',
      issue: 'No standalone skills section detected. Keyword parsers index skills faster when clustered under a dedicated header.',
      fix: 'Add a "Technical Skills" section categorized by: Languages, Frameworks, Cloud/DevOps, and Databases.',
    });
  }

  if (!hasEducation) {
    sectionScore -= 4;
    suggestions.push({
      id: 'missing-education-section',
      category: 'sections',
      type: 'warning',
      impact: 'medium',
      title: 'Education Section Not Detected',
      issue: 'Could not locate an "Education" section or recognized degree keyword.',
      fix: 'Include your degree, institution, and graduation year (or "Self-Taught / Open Source Contributor" if non-traditional).',
    });
  }

  if (!hasProjects) {
    sectionScore -= 3;
    suggestions.push({
      id: 'missing-projects-section',
      category: 'sections',
      type: 'warning',
      impact: 'low',
      title: 'No "Projects" or "Open Source" Section',
      issue: 'High-growth tech companies and remote employers prize side projects and production open-source contributions.',
      fix: 'Add a "Key Projects" section highlighting 1–2 architectural builds with live links or GitHub repos.',
    });
  }

  sectionScore = Math.max(0, Math.min(20, sectionScore));

  // ============================================================================
  // 4. Quantifiable Impact & Metrics (20 pts)
  // ============================================================================
  let impactScore = 20;

  // 4.1 Count strong action verbs
  let actionVerbCount = 0;
  for (const verb of STRONG_ACTION_VERBS) {
    const verbRegex = new RegExp(`\\b${verb}\\b`, 'gi');
    const matches = text.match(verbRegex);
    if (matches) actionVerbCount += matches.length;
  }

  // 4.2 Count quantifiable metrics (%, $, ms, scale, users, etc.)
  const metricPatterns = [
    /\b\d+(\.\d+)?%(\+)?/gi,                        // Percentages (35%, 90%+, 99.9%)
    /[\$€£]\s?\d+[\d,]*(\.\d+)?[kmb]?\b/gi,         // Currency ($120k, $4.5M)
    /\b\d+\s?(ms|s|seconds|minutes|hours)\b/gi,     // Latency & time (200ms, 45s)
    /\b\d+x\b/gi,                                   // Multipliers (3x, 10x)
    /\b\d+[\d,]*\s?(users|clients|customers|qps|rps|req|requests|events|stars|downloads|endpoints|nodes|queries)\b/gi, // Scale metrics
    /\b\d+k\+?\b/gi,                                // e.g. 10k+, 50k
    /\b\d+\+\s*(production|engineers|team|years|projects|features|videos|hotfixes|nodes|apps|applications|issues|clients|regressions)\b/gi, // e.g. 12+ production issues, 5+ frontend engineers
    /\b(from\s+)?\d+\s+to\s+\d+\+?\b/gi,            // e.g. 70 to 90+, 45 minutes to 4 minutes
    /\b\d+[\d,]*\s?(million|billion)\b/gi           // Magnitude (10 million)
  ];

  let quantifiableMetricCount = 0;
  for (const pattern of metricPatterns) {
    const matches = text.match(pattern);
    if (matches) quantifiableMetricCount += matches.length;
  }

  // 4.3 Weak phrases check
  let weakPhraseCount = 0;
  for (const phrase of WEAK_PASSIVE_PHRASES) {
    const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
    const matches = text.match(regex);
    if (matches) weakPhraseCount += matches.length;
  }

  if (actionVerbCount < 5) {
    impactScore -= 7;
    suggestions.push({
      id: 'low-action-verbs',
      category: 'impact',
      type: 'critical',
      impact: 'high',
      title: 'Low Frequency of Strong Action Verbs',
      issue: `Only found ${actionVerbCount} high-signal engineering action verbs in your entire resume.`,
      fix: 'Start every bullet point with a decisive engineering verb: "Architected", "Engineered", "Optimized", "Refactored", or "Scaled".',
      example: 'Change "Worked on payment gateway" → "Architected fault-tolerant Stripe checkout flow with idempotency keys."',
    });
  } else if (actionVerbCount < 10) {
    impactScore -= 3;
    suggestions.push({
      id: 'moderate-action-verbs',
      category: 'impact',
      type: 'warning',
      impact: 'medium',
      title: 'Strengthen Lead Verbs on Recent Roles',
      issue: `Found ${actionVerbCount} action verbs. Raising this to 12+ verbs significantly improves automated recruiter scoring.`,
      fix: 'Replace generic verbs like "Built" or "Created" with precision engineering terms ("Orchestrated", "Spearheaded").',
    });
  }

  if (quantifiableMetricCount < 3) {
    impactScore -= 8;
    suggestions.push({
      id: 'low-metrics',
      category: 'impact',
      type: 'critical',
      impact: 'high',
      title: 'Missing Quantifiable Data & Performance Metrics',
      issue: `Detected only ${quantifiableMetricCount} quantifiable metrics (% improvement, latency reduction, user scale, revenue).`,
      fix: 'Apply the Google X-Y-Z formula: "Accomplished [X] as measured by [Y] by doing [Z]".',
      example: '"Reduced P99 API latency from 450ms to 85ms (81% decrease) by introducing Redis caching and SQL indexing."',
    });
  } else if (quantifiableMetricCount < 6) {
    impactScore -= 3;
    suggestions.push({
      id: 'moderate-metrics',
      category: 'impact',
      type: 'warning',
      impact: 'medium',
      title: 'Add More Quantifiable Results',
      issue: `Found ${quantifiableMetricCount} metric points. Senior engineers are judged by measurable business & performance outcomes.`,
      fix: 'Include metrics for test coverage, CI build duration, database query speed, monthly active users, or cloud cost savings.',
    });
  }

  if (weakPhraseCount > 0) {
    impactScore -= Math.min(5, weakPhraseCount * 2);
    suggestions.push({
      id: 'weak-passive-phrasing',
      category: 'impact',
      type: 'warning',
      impact: 'medium',
      title: 'Passive Phrasing Detected',
      issue: `Found ${weakPhraseCount} instances of passive wording like "Responsible for" or "Worked on".`,
      fix: 'Eliminate passive phrases. Describe the direct ownership and business result instead.',
    });
  }

  impactScore = Math.max(0, Math.min(20, impactScore));

  // ============================================================================
  // 5. Skill Depth & Keyword Relevance (20 pts)
  // ============================================================================
  const { groups: detectedSkillGroups, flatList: detectedSkills } = extractSkillsFromText(text);

  let skillsScore = 20;

  if (detectedSkills.length < 5) {
    skillsScore -= 12;
    suggestions.push({
      id: 'low-skills-density',
      category: 'skills',
      type: 'critical',
      impact: 'high',
      title: 'Very Low Keyword & Technology Density',
      issue: `Only ${detectedSkills.length} recognized developer skills found. ATS algorithms rank candidates by keyword overlap with the Job Description.`,
      fix: 'Explicitly mention core libraries, cloud providers, and architectural patterns you use daily.',
    });
  } else if (detectedSkills.length < 10) {
    skillsScore -= 5;
    suggestions.push({
      id: 'moderate-skills-density',
      category: 'skills',
      type: 'warning',
      impact: 'medium',
      title: 'Expand Cloud, Database, or Testing Keywords',
      issue: `Detected ${detectedSkills.length} tech skills. Adding supporting infrastructure (Docker, CI/CD, Jest, PostgreSQL) rounds out your profile.`,
      fix: 'Ensure your stack covers language + framework + database + cloud/tooling.',
    });
  }

  skillsScore = Math.max(0, Math.min(20, skillsScore));

  // ============================================================================
  // Total Score & Verdict
  // ============================================================================
  const rawScore = layoutScore + contactScore + sectionScore + impactScore + skillsScore;
  const overallScore = Math.max(0, Math.min(100, Math.round(rawScore)));

  let verdict: AtsScoreResult['verdict'];
  const hasStrongMetrics = quantifiableMetricCount >= 3;

  if (overallScore >= 88 && hasStrongMetrics) {
    verdict = {
      label: 'ATS Optimized (Top 5% Candidate)',
      tier: 'excellent',
      color: '#10b981', // Emerald
      summary: 'Your resume demonstrates elite parseability, strong quantifiable metrics, and solid keyword density. It will sail through Workday, Greenhouse, and Lever parsers.',
    };
  } else if (overallScore >= 80) {
    verdict = {
      label: hasStrongMetrics ? 'ATS Ready (Strong Candidate)' : 'Strong Profile (Metrics Optimization Needed)',
      tier: hasStrongMetrics ? 'excellent' : 'good',
      color: hasStrongMetrics ? '#10b981' : '#f59e0b',
      summary: hasStrongMetrics
        ? 'Your resume demonstrates high parseability, strong action verbs, and solid keyword density across modern tracking platforms.'
        : 'Your resume demonstrates clean structure and high keyword density, but lacks quantifiable business impact metrics (e.g. % latency reduction, user scale, efficiency gains). Adding concrete numbers will unlock top-tier callbacks.',
    };
  } else if (overallScore >= 65) {
    verdict = {
      label: 'Good (Minor Fixes Needed)',
      tier: 'good',
      color: '#f59e0b', // Amber
      summary: 'Your resume is readable by most ATS parsers, but fixing 2–3 key issues below will substantially increase recruiter callback rates.',
    };
  } else if (overallScore >= 50) {
    verdict = {
      label: 'Needs Optimization',
      tier: 'warning',
      color: '#f97316', // Orange
      summary: 'Automated screening bots will struggle with missing impact metrics or formatting traps. Apply the prioritized fixes below before applying to tier-1 roles.',
    };
  } else {
    verdict = {
      label: 'High ATS Rejection Risk',
      tier: 'danger',
      color: '#ef4444', // Red
      summary: 'Significant formatting or structural issues prevent modern applicant tracking systems from parsing your experience properly.',
    };
  }

  // ============================================================================
  // ATS Systems Audit Matrix
  // ============================================================================
  const atsSystems: AtsSystemAudit[] = [
    {
      system: 'Workday',
      status: layoutScore >= 20 && hasEmail ? 'pass' : layoutScore >= 14 ? 'warning' : 'fail',
      summary: layoutScore >= 20 ? 'Clean single-column layout passes' : 'Vulnerable to table & column parsing traps',
      detail: 'Workday is notoriously strict. It strips headers/footers and scrambles multi-column tables into unreadable single-line strings.',
    },
    {
      system: 'Greenhouse',
      status: hasExperience && hasSkills && hasEmail ? 'pass' : 'warning',
      summary: hasExperience && hasSkills ? 'Standard section headers recognized' : 'Missing standard section keys',
      detail: 'Greenhouse looks for standard chronological progression and maps skills to applicant scorecard fields.',
    },
    {
      system: 'Lever',
      status: hasEmail && hasPhone && hasExperience ? 'pass' : 'warning',
      summary: hasEmail && hasPhone ? 'Contact info and timeline mapped' : 'Candidate contact mapping incomplete',
      detail: 'Lever creates candidate records automatically from top contact blocks and validates employment tenure.',
    },
    {
      system: 'Ashby',
      status: overallScore >= 65 ? 'pass' : 'warning',
      summary: overallScore >= 65 ? 'Modern markdown/plain text compatibility' : 'Keyword density below threshold',
      detail: 'Ashby is a modern ATS favored by high-growth startups with advanced semantic search over candidate repositories.',
    },
  ];

  // ============================================================================
  // Categories Summary
  // ============================================================================
  const categories: CategoryScore[] = [
    {
      id: 'layout',
      name: 'ATS Parseability & Layout',
      score: layoutScore,
      maxScore: 25,
      weight: 'high',
      status: layoutScore >= 22 ? 'excellent' : layoutScore >= 16 ? 'good' : layoutScore >= 10 ? 'needs-work' : 'critical',
      summary: layoutScore >= 22 ? 'Clean layout with no detected column traps' : 'Formatting issues may confuse legacy parsers',
    },
    {
      id: 'impact',
      name: 'Impact & Quantifiable Metrics',
      score: impactScore,
      maxScore: 20,
      weight: 'high',
      status: impactScore >= 17 ? 'excellent' : impactScore >= 13 ? 'good' : impactScore >= 8 ? 'needs-work' : 'critical',
      summary: `${actionVerbCount} action verbs, ${quantifiableMetricCount} quantifiable metrics detected`,
    },
    {
      id: 'skills',
      name: 'Tech Stack & Keyword Density',
      score: skillsScore,
      maxScore: 20,
      weight: 'high',
      status: skillsScore >= 17 ? 'excellent' : skillsScore >= 13 ? 'good' : skillsScore >= 8 ? 'needs-work' : 'critical',
      summary: `${detectedSkills.length} modern tech competencies recognized`,
    },
    {
      id: 'sections',
      name: 'Core Section Structure',
      score: sectionScore,
      maxScore: 20,
      weight: 'medium',
      status: sectionScore >= 18 ? 'excellent' : sectionScore >= 14 ? 'good' : sectionScore >= 9 ? 'needs-work' : 'critical',
      summary: 'Standard Experience, Education, and Skills headers verified',
    },
    {
      id: 'contact',
      name: 'Contact & Profile Hygiene',
      score: contactScore,
      maxScore: 15,
      weight: 'medium',
      status: contactScore >= 14 ? 'excellent' : contactScore >= 10 ? 'good' : contactScore >= 6 ? 'needs-work' : 'critical',
      summary: hasEmail && hasPhone ? 'Email, phone, and profile links verified' : 'Missing critical contact information',
    },
  ];

  // ============================================================================
  // Matched Jobs Bridge (Role-Aware)
  // ============================================================================
  const matchedJobs = matchJobsForSkills(detectedSkills, text, 4);

  // Short snippet of extracted text for transparency
  const extractedTextPreview = text.slice(0, 1500) + (text.length > 1500 ? '...' : '');

  return {
    overallScore,
    verdict,
    metrics: {
      wordCount: resume.wordCount,
      pageCount: resume.pageCount,
      actionVerbCount,
      quantifiableMetricCount,
      detectedSkillCount: detectedSkills.length,
    },
    categories,
    suggestions,
    atsSystems,
    detectedSkills: detectedSkillGroups,
    matchedJobs,
    extractedTextPreview,
  };
}
