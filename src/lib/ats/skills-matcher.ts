import type { DetectedSkillGroup, MatchedJob } from './types';
import rawJobs from '../../data/jobs.json';

export interface TechSkillDefinition {
  name: string;
  category: 'Frontend' | 'Backend' | 'Cloud & DevOps' | 'Databases & Data' | 'Architecture & Testing';
  patterns: RegExp[];
}

export const TECH_SKILLS_DICTIONARY: TechSkillDefinition[] = [
  // Frontend
  { name: 'React', category: 'Frontend', patterns: [/\breact(\.js)?\b/i] },
  { name: 'TypeScript', category: 'Frontend', patterns: [/\btype-?script\b/i] },
  { name: 'JavaScript', category: 'Frontend', patterns: [/\bjava-?script\b/i, /\bes[56789]\b/i] },
  { name: 'Next.js', category: 'Frontend', patterns: [/\bnext(\.js)?\b/i] },
  { name: 'Vue.js', category: 'Frontend', patterns: [/\bvue(\.js)?\b/i, /\bnuxt\b/i] },
  { name: 'Angular', category: 'Frontend', patterns: [/\bangular(\.js)?\b/i] },
  { name: 'Svelte', category: 'Frontend', patterns: [/\bsvelte(kit)?\b/i] },
  { name: 'Tailwind CSS', category: 'Frontend', patterns: [/\btailwind(css)?\b/i] },
  { name: 'HTML5/CSS3', category: 'Frontend', patterns: [/\bhtml5?\b/i, /\bcss3?\b/i, /\bsass\b/i, /\bscss\b/i] },
  { name: 'Redux / State', category: 'Frontend', patterns: [/\bredux\b/i, /\bzustand\b/i, /\bmobx\b/i, /\btanstack\b/i] },
  { name: 'GraphQL', category: 'Frontend', patterns: [/\bgraph-?ql\b/i, /\bapollo\b/i] },

  // Backend
  { name: 'Node.js', category: 'Backend', patterns: [/\bnode(\.js)?\b/i] },
  { name: 'Python', category: 'Backend', patterns: [/\bpython\b/i, /\bdjango\b/i, /\bfastapi\b/i, /\bflask\b/i] },
  { name: 'Go (Golang)', category: 'Backend', patterns: [/\bgo\s?lang\b/i, /\bgolang\b/i, /\bgo\s+(backend|developer|engineer|microservices)\b/i] },
  { name: 'Rust', category: 'Backend', patterns: [/\brust\b/i] },
  { name: 'Java', category: 'Backend', patterns: [/\bjava\b/i, /\bspring\s?boot\b/i] },
  { name: 'C# / .NET', category: 'Backend', patterns: [/\bc#\b/i, /\b\.net(\s?core)?\b/i] },
  { name: 'Ruby', category: 'Backend', patterns: [/\bruby(\s+on\s+rails)?\b/i] },
  { name: 'REST APIs', category: 'Backend', patterns: [/\brest(ful)?\s+api[s]?\b/i] },
  { name: 'Microservices', category: 'Backend', patterns: [/\bmicro-?services\b/i] },

  // Cloud & DevOps
  { name: 'AWS', category: 'Cloud & DevOps', patterns: [/\baws\b/i, /\bamazon\s+web\s+services\b/i, /\bs3\b/i, /\blambda\b/i, /\bec2\b/i] },
  { name: 'Docker', category: 'Cloud & DevOps', patterns: [/\bdocker\b/i, /\bcontainer(s|ization)?\b/i] },
  { name: 'Kubernetes', category: 'Cloud & DevOps', patterns: [/\bkubernetes\b/i, /\bk8s\b/i] },
  { name: 'GCP', category: 'Cloud & DevOps', patterns: [/\bgoogle\s+cloud\b/i, /\bgcp\b/i] },
  { name: 'Azure', category: 'Cloud & DevOps', patterns: [/\bazure\b/i] },
  { name: 'CI/CD Pipelines', category: 'Cloud & DevOps', patterns: [/\bci\/?cd\b/i, /\bgithub\s+actions\b/i, /\bjenkins\b/i, /\bgitlab\b/i] },
  { name: 'Terraform', category: 'Cloud & DevOps', patterns: [/\bterraform\b/i, /\biac\b/i] },

  // Databases & Data
  { name: 'PostgreSQL', category: 'Databases & Data', patterns: [/\bpostgres(ql)?\b/i] },
  { name: 'MongoDB', category: 'Databases & Data', patterns: [/\bmongo(db)?\b/i] },
  { name: 'Redis', category: 'Databases & Data', patterns: [/\bredis\b/i] },
  { name: 'MySQL', category: 'Databases & Data', patterns: [/\bmysql\b/i] },
  { name: 'SQL / RDBMS', category: 'Databases & Data', patterns: [/\bsql\b/i, /\brdbms\b/i] },
  { name: 'Kafka', category: 'Databases & Data', patterns: [/\bkafka\b/i, /\brabbitmq\b/i, /\bevent-driven\b/i] },

  // Architecture & Testing
  { name: 'System Design', category: 'Architecture & Testing', patterns: [/\bsystem\s+design\b/i, /\bscalable\s+architecture\b/i, /\bhigh\s+availability\b/i] },
  { name: 'Unit/E2E Testing', category: 'Architecture & Testing', patterns: [/\bjest\b/i, /\bvitest\b/i, /\bcypress\b/i, /\bplaywright\b/i, /\btesting-library\b/i, /\btdd\b/i] },
  { name: 'Git & Version Control', category: 'Architecture & Testing', patterns: [/\bgit\b/i, /\bgithub\b/i, /\bbranching\s+strategies\b/i] }
];

export function extractSkillsFromText(text: string): {
  groups: DetectedSkillGroup[];
  flatList: string[];
} {
  const detectedByCat: { [key: string]: Set<string> } = {
    'Frontend': new Set(),
    'Backend': new Set(),
    'Cloud & DevOps': new Set(),
    'Databases & Data': new Set(),
    'Architecture & Testing': new Set(),
  };

  const flatSet = new Set<string>();

  for (const def of TECH_SKILLS_DICTIONARY) {
    for (const pattern of def.patterns) {
      if (pattern.test(text)) {
        detectedByCat[def.category].add(def.name);
        flatSet.add(def.name);
        break;
      }
    }
  }

  const groups: DetectedSkillGroup[] = Object.entries(detectedByCat)
    .filter(([_, set]) => set.size > 0)
    .map(([category, set]) => ({
      category,
      skills: Array.from(set).sort(),
    }));

  return {
    groups,
    flatList: Array.from(flatSet),
  };
}

export function matchJobsForSkills(
  detectedSkills: string[],
  resumeText: string = '',
  limit: number = 4
): MatchedJob[] {
  if (!Array.isArray(rawJobs) || rawJobs.length === 0) {
    return [];
  }

  const lowerText = resumeText.toLowerCase();

  // Detect candidate's primary engineering persona & domain
  const isFrontend = /\b(frontend|front-end|ui architect|ui lead|ui engineer|react|vue|angular|web development|design systems)\b/i.test(lowerText);
  const isBackend = /\b(backend|back-end|microservices|distributed systems|fastapi|django|spring boot|golang)\b/i.test(lowerText);
  const isQA = /\b(qa engineer|quality assurance|sdet|test automation|software test engineer)\b/i.test(lowerText);
  const isDataAI = /\b(data scientist|data science|machine learning research|deep learning researcher|computer vision)\b/i.test(lowerText);
  const isLead = /\b(senior|lead|staff|principal|architect|director)\b/i.test(lowerText);

  // Score each job based on skill overlap + role title affinity
  const scoredJobs = rawJobs.map((job: any) => {
    const jobTags = Array.isArray(job.tags) ? job.tags : [];
    const jobTitle = (job.title || '').toLowerCase();
    const matching: string[] = [];

    // 1. Skill overlap
    for (const skill of detectedSkills) {
      const sLower = skill.toLowerCase();
      const inTags = jobTags.some((t: string) => t.toLowerCase() === sLower || t.toLowerCase().includes(sLower));
      const inTitle = jobTitle.includes(sLower);

      if (inTags || inTitle) {
        matching.push(skill);
      }
    }

    let relevanceScore = matching.length * 4;

    // 2. Role Title Affinity & Domain Guardrails
    if (isFrontend) {
      // Prioritize frontend, UI, react, and full-stack titles
      if (jobTitle.includes('frontend') || jobTitle.includes('front-end') || jobTitle.includes('ui') || jobTitle.includes('react')) {
        relevanceScore += 12;
      } else if (jobTitle.includes('full-stack') || jobTitle.includes('full stack') || jobTitle.includes('web')) {
        relevanceScore += 8;
      } else if (jobTitle.includes('qa') || jobTitle.includes('quality') || jobTitle.includes('test') || jobTitle.includes('sdet')) {
        relevanceScore -= 30; // Strongly exclude QA for frontend/UI engineers
      } else if (jobTitle.includes('data scientist') || jobTitle.includes('data analyst')) {
        relevanceScore -= 30; // Strongly exclude Data Science for frontend/UI engineers
      }
    }

    if (isBackend) {
      if (jobTitle.includes('backend') || jobTitle.includes('back-end') || jobTitle.includes('api') || jobTitle.includes('distributed') || jobTitle.includes('node')) {
        relevanceScore += 10;
      }
    }

    if (isLead && (jobTitle.includes('senior') || jobTitle.includes('lead') || jobTitle.includes('staff') || jobTitle.includes('principal') || jobTitle.includes('architect'))) {
      relevanceScore += 5;
    }

    // 3. Prevent mismatched core ecosystem recommendations (e.g. .NET role for MERN dev)
    const ecosystemChecks = [
      { pattern: /\b(\.net|c#)\b/i, requiredSkill: 'C# / .NET' },
      { pattern: /\b(ruby|rails)\b/i, requiredSkill: 'Ruby' },
      { pattern: /\b(php|laravel)\b/i, requiredSkill: 'PHP' },
      { pattern: /\b(golang|go developer|go engineer)\b/i, requiredSkill: 'Go (Golang)' },
      { pattern: /\b(rust)\b/i, requiredSkill: 'Rust' },
      { pattern: /\b(ios|swift)\b/i, requiredSkill: 'iOS' },
      { pattern: /\b(android|kotlin)\b/i, requiredSkill: 'Android' },
    ];

    for (const eco of ecosystemChecks) {
      if (eco.pattern.test(jobTitle) && !detectedSkills.includes(eco.requiredSkill)) {
        relevanceScore -= 35; // Strongly downrank jobs demanding an ecosystem the candidate lacks
      }
    }

    // 4. Downrank non-developer support/analyst roles (e.g. Incident Response Analyst)
    if (/\b(incident response|analyst|support specialist|technical support|operations analyst)\b/i.test(jobTitle)) {
      relevanceScore -= 30;
    }

    // 5. Prioritize true remote positions over in-office
    const workplace = (job.workplaceType || '').toLowerCase();
    const loc = (job.location || '').toLowerCase();
    if (workplace === 'in-office' || loc === 'in-office') {
      relevanceScore -= 40;
    } else if (workplace === 'remote' || loc.includes('remote')) {
      relevanceScore += 6;
    }

    return {
      job,
      relevanceScore,
      matchCount: matching.length,
      matchingSkills: Array.from(new Set(matching)),
    };
  });

  // Filter out any negative relevance scores (explicitly rejected domains)
  const validMatched = scoredJobs
    .filter((j) => j.relevanceScore > 0 && j.matchCount > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore);

  const selected = validMatched.length > 0 ? validMatched.slice(0, limit) : scoredJobs.slice(0, limit);

  return selected.map(({ job, matchingSkills }) => ({
    id: job.id || job.slug,
    slug: job.slug || '',
    title: job.title || 'Senior Software Engineer',
    company: job.company || 'Verified Remote Employer',
    location: job.location || 'Remote',
    region: job.region || 'Worldwide',
    tags: Array.isArray(job.tags) ? job.tags.slice(0, 4) : [],
    applyUrl: job.applyUrl || '/jobs/',
    matchingSkills,
  }));
}
