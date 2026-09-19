import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGET_FILE = path.join(__dirname, '../src/data/jobs.json');
const FEATURED_FILE = path.join(__dirname, '../src/data/featured-jobs.json');

// Desired tech keywords to match (using word boundary check)
const TECH_KEYWORDS = [
  'frontend', 'front-end', 'front end',
  'backend', 'back-end', 'back end',
  'fullstack', 'full-stack', 'full stack',
  'react', 'next.js', 'vue', 'angular', 'svelte',
  'typescript', 'javascript', 'node.js', 'nodejs',
  'python', 'django', 'fastapi', 'flask',
  'java', 'spring', 'springboot', 'spring boot',
  'golang', 'rust',
  'software engineer', 'staff engineer', 'principal engineer',
  'product engineer', 'founding engineer', 'systems engineer',
  'distributed systems', 'cloud engineer', 'data engineer',
  'machine learning', 'ai engineer', 'ml engineer'
];

// Negative keywords to filter out non-engineering/irrelevant roles
const NEGATIVE_KEYWORDS = [
  'recruiter', 'recruiting', 'talent', 'sourcer', 'sales',
  'account executive', 'account manager', 'marketing', 'seo',
  'customer support', 'customer success', 'legal', 'compliance officer',
  'office manager', 'data entry', 'finance manager', 'copywriter',
  'people partner', 'hr generalist', 'payroll', 'event coordinator',
  'go-to-market', 'gtm', 'rater', 'quality rater', 'translator',
  'transcription', 'call center', 'customer service', 'billing specialist',
  'tax manager', 'paralegal', 'administrative assistant'
];

function isRelevantJob(title, description = '') {
  const tLower = title.toLowerCase();
  const combined = (title + ' ' + description).toLowerCase();
  
  // Check negatives first
  for (const neg of NEGATIVE_KEYWORDS) {
    if (new RegExp(`\\b${neg}\\b`, 'i').test(tLower)) return false;
  }

  // Check UI and specific languages with word boundaries
  if (/\bui\b/i.test(tLower) || /\bux engineer\b/i.test(tLower)) return true;
  if (/\bjava\b/i.test(tLower) && !tLower.includes('javascript')) return true;
  if (/\bpython\b/i.test(tLower)) return true;
  if (/\bgolang\b/i.test(tLower) || /\bgo engineer\b/i.test(tLower) || /\bgo developer\b/i.test(tLower)) return true;
  if (/\brust\b/i.test(tLower)) return true;

  // Check tech keywords
  for (const kw of TECH_KEYWORDS) {
    if (combined.includes(kw)) return true;
  }
  return false;
}

function normalizeRegion(locationStr = '') {
  const loc = locationStr.toLowerCase();
  if (loc.includes('canada') || loc.includes('toronto') || loc.includes('vancouver') || loc.includes('montreal')) {
    return 'Canada';
  }
  if (
    loc.includes('united states') || loc.includes('usa') || loc.includes('u.s.') ||
    loc.includes('remote - us') || loc.includes('remote (us)') || loc.includes('remote, us') ||
    loc.includes('san francisco') || loc.includes('new york') || loc.includes('seattle') ||
    loc.includes('austin') || loc.includes('chicago') || loc.includes('los angeles') ||
    loc.includes('americas') || loc.includes('north america')
  ) {
    return 'US';
  }
  if (
    loc.includes('europe') || loc.includes('eu') || loc.includes('emea') ||
    loc.includes('united kingdom') || loc.includes('uk') || loc.includes('london') ||
    loc.includes('germany') || loc.includes('berlin') || loc.includes('france') ||
    loc.includes('paris') || loc.includes('amsterdam') || loc.includes('netherlands') ||
    loc.includes('ireland') || loc.includes('dublin') || loc.includes('spain') ||
    loc.includes('switzerland') || loc.includes('poland')
  ) {
    return 'EU';
  }
  if (loc.includes('worldwide') || loc.includes('global') || loc.includes('anywhere') || loc.includes('all regions')) {
    return 'Worldwide';
  }
  return 'Worldwide';
}

function extractTags(title, desc = '') {
  const text = (title + ' ' + desc).toLowerCase();
  const tags = new Set();

  // Role Type
  if (text.includes('frontend') || text.includes('front-end')) tags.add('Frontend');
  if (text.includes('backend') || text.includes('back-end')) tags.add('Backend');
  if (text.includes('fullstack') || text.includes('full-stack')) tags.add('Full-Stack');
  if (text.includes('machine learning') || text.includes('ai engineer') || text.includes('ml engineer')) tags.add('AI / ML');

  // Languages & Frameworks
  if (text.includes('react')) tags.add('React');
  if (text.includes('typescript')) tags.add('TypeScript');
  if (/\bpython\b/i.test(text)) tags.add('Python');
  if (/\bjava\b/i.test(text) && !text.includes('javascript')) tags.add('Java');
  if (/\bgolang\b/i.test(text) || /\bgo\b/i.test(title)) tags.add('Go');
  if (/\brust\b/i.test(text)) tags.add('Rust');
  if (text.includes('node') || text.includes('nodejs')) tags.add('Node.js');
  if (/\b(ui|ux)\b/i.test(text) || text.includes('design system')) tags.add('UI/UX');

  // Seniority
  if (text.includes('staff') || text.includes('principal') || text.includes('lead')) tags.add('Staff/Lead');
  else if (text.includes('senior')) tags.add('Senior');

  if (tags.size === 0) tags.add('Software Engineer');
  return Array.from(tags).slice(0, 4);
}

function createSlug(title, company) {
  return `${company}-${title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

// Fetch Greenhouse boards
async function fetchGreenhouse(company, boardName) {
  try {
    const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=false`, {
      headers: { 'User-Agent': 'DevScrolls-Job-Sync/1.0' },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.jobs || !Array.isArray(data.jobs)) return [];

    const jobs = [];
    for (const j of data.jobs) {
      const title = j.title || '';
      const location = j.location?.name || 'Remote';
      if (!isRelevantJob(title, location)) continue;

      const region = normalizeRegion(location);
      jobs.push({
        id: `gh-${company}-${j.id}`,
        slug: createSlug(title, boardName),
        title,
        company: boardName,
        companyLogo: `https://www.google.com/s2/favicons?domain=${company}.com&sz=128`,
        location,
        region,
        workplaceType: location.toLowerCase().includes('remote') ? 'Remote' : 'Hybrid/Remote',
        tags: extractTags(title, location),
        applyUrl: j.absolute_url,
        datePosted: j.updated_at ? new Date(j.updated_at).toISOString() : new Date().toISOString(),
        source: 'Direct ATS',
        descriptionSnippet: `Explore this ${title} role at ${boardName}. Direct company career opening with high-impact engineering opportunities.`
      });
    }
    return jobs;
  } catch (err) {
    console.warn(`Greenhouse [${company}] skipped:`, err.message);
    return [];
  }
}

// Fetch Ashby boards
async function fetchAshby(company, boardName) {
  try {
    const res = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${company}`, {
      headers: { 'User-Agent': 'DevScrolls-Job-Sync/1.0' },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.jobs || !Array.isArray(data.jobs)) return [];

    const jobs = [];
    for (const j of data.jobs) {
      const title = j.title || '';
      const location = j.location || (j.isRemote ? 'Remote' : 'Hybrid');
      if (!isRelevantJob(title, location)) continue;

      const region = normalizeRegion(location);
      jobs.push({
        id: `ashby-${company}-${j.id}`,
        slug: createSlug(title, boardName),
        title,
        company: boardName,
        companyLogo: `https://www.google.com/s2/favicons?domain=${company}.com&sz=128`,
        location,
        region,
        workplaceType: j.isRemote || location.toLowerCase().includes('remote') ? 'Remote' : 'Hybrid',
        tags: extractTags(title, location),
        applyUrl: j.jobUrl || `https://jobs.ashbyhq.com/${company}/${j.id}`,
        datePosted: j.publishedAt ? new Date(j.publishedAt).toISOString() : new Date().toISOString(),
        salary: j.compensation?.scrapeableSalaryRange ? `${j.compensation.scrapeableSalaryRange}` : undefined,
        source: 'Direct ATS',
        descriptionSnippet: `Join ${boardName} as a ${title}. Building high-performance software with modern engineering standards.`
      });
    }
    return jobs;
  } catch (err) {
    console.warn(`Ashby [${company}] skipped:`, err.message);
    return [];
  }
}

// Fetch Jobicy (US / EU / Canada remote tech)
async function fetchJobicy() {
  try {
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=40&industry=engineering', {
      headers: { 'User-Agent': 'DevScrolls-Job-Sync/1.0' },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.jobs || !Array.isArray(data.jobs)) return [];

    const jobs = [];
    for (const j of data.jobs) {
      const title = j.jobTitle || '';
      const desc = j.jobDescription || '';
      if (!isRelevantJob(title, desc)) continue;

      const location = j.jobGeo || 'Remote';
      const region = normalizeRegion(location);
      let salary = undefined;
      if (j.annualSalaryMin && j.annualSalaryMax) {
        salary = `$${Math.round(j.annualSalaryMin / 1000)}k – $${Math.round(j.annualSalaryMax / 1000)}k ${j.salaryCurrency || 'USD'}`;
      }

      jobs.push({
        id: `jobicy-${j.id}`,
        slug: createSlug(title, j.companyName || 'tech'),
        title,
        company: j.companyName || 'Remote Tech Co',
        companyLogo: j.companyLogo || undefined,
        location: j.jobGeo ? `Remote (${j.jobGeo})` : 'Remote',
        region,
        workplaceType: 'Remote',
        tags: extractTags(title, desc),
        salary,
        applyUrl: j.url,
        datePosted: j.pubDate ? new Date(j.pubDate).toISOString() : new Date().toISOString(),
        source: 'Jobicy Verified',
        descriptionSnippet: (j.jobExcerpt || desc.replace(/<[^>]*>?/gm, ''))
          .slice(0, 180).trim() + '...'
      });
    }
    return jobs;
  } catch (err) {
    console.warn('Jobicy fetch skipped:', err.message);
    return [];
  }
}

// Fetch Remotive
async function fetchRemotive() {
  try {
    const res = await fetch('https://remotive.com/api/remote-jobs?category=software-dev&limit=30', {
      headers: { 'User-Agent': 'DevScrolls-Job-Sync/1.0' },
      signal: AbortSignal.timeout(8000)
    });
    if (!res.ok) return [];
    const data = await res.json();
    if (!data.jobs || !Array.isArray(data.jobs)) return [];

    const jobs = [];
    for (const j of data.jobs) {
      const title = j.title || '';
      const desc = j.description || '';
      if (!isRelevantJob(title, desc)) continue;

      const location = j.candidate_required_location || 'Worldwide';
      const region = normalizeRegion(location);

      jobs.push({
        id: `remotive-${j.id}`,
        slug: createSlug(title, j.company_name || 'remotive'),
        title,
        company: j.company_name,
        companyLogo: j.company_logo || undefined,
        location: location.toLowerCase().includes('remote') ? location : `Remote (${location})`,
        region,
        workplaceType: 'Remote',
        tags: extractTags(title, desc),
        salary: j.salary || undefined,
        applyUrl: j.url,
        datePosted: j.publication_date ? new Date(j.publication_date).toISOString() : new Date().toISOString(),
        source: 'Remotive',
        descriptionSnippet: desc.replace(/<[^>]*>?/gm, '').slice(0, 180).trim() + '...'
      });
    }
    return jobs;
  } catch (err) {
    console.warn('Remotive fetch skipped:', err.message);
    return [];
  }
}

// Fair round-robin interleaving so top companies rotate naturally
function interleaveJobsByCompany(items) {
  const companyBuckets = new Map();
  for (const job of items) {
    if (!companyBuckets.has(job.company)) {
      companyBuckets.set(job.company, []);
    }
    companyBuckets.get(job.company).push(job);
  }

  // Sort each company's queue newest first
  for (const list of companyBuckets.values()) {
    list.sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime());
  }

  // Order the company queues by their freshest job
  const sortedCompanies = Array.from(companyBuckets.keys()).sort((a, b) => {
    const freshA = new Date(companyBuckets.get(a)[0].datePosted).getTime();
    const freshB = new Date(companyBuckets.get(b)[0].datePosted).getTime();
    return freshB - freshA;
  });

  // Round-robin selection: 1 job per company per cycle
  const interleaved = [];
  let hasMore = true;
  while (hasMore) {
    hasMore = false;
    for (const company of sortedCompanies) {
      const list = companyBuckets.get(company);
      if (list && list.length > 0) {
        interleaved.push(list.shift());
        hasMore = true;
      }
    }
  }

  return interleaved;
}

async function main() {
  console.log('🚀 Starting DevScrolls High-Paying Remote Tech Jobs Sync...');

  const greenhouseCompanies = [
    { slug: 'cloudflare', name: 'Cloudflare' },
    { slug: 'gitlab', name: 'GitLab' },
    { slug: 'stripe', name: 'Stripe' },
    { slug: 'datadog', name: 'Datadog' }
  ];

  const ashbyCompanies = [
    { slug: 'linear', name: 'Linear' },
    { slug: 'perplexity', name: 'Perplexity AI' },
    { slug: 'ramp', name: 'Ramp' },
    { slug: 'sentry', name: 'Sentry' },
    { slug: 'cursor', name: 'Cursor (Anysphere)' }
  ];

  const allJobs = [];

  // 1. Fetch Greenhouse
  for (const c of greenhouseCompanies) {
    console.log(`Fetching Greenhouse: ${c.name}...`);
    const jobs = await fetchGreenhouse(c.slug, c.name);
    allJobs.push(...jobs);
  }

  // 2. Fetch Ashby
  for (const c of ashbyCompanies) {
    console.log(`Fetching Ashby: ${c.name}...`);
    const jobs = await fetchAshby(c.slug, c.name);
    allJobs.push(...jobs);
  }

  // 3. Fetch Jobicy
  console.log('Fetching Jobicy Engineering...');
  const jobicyJobs = await fetchJobicy();
  allJobs.push(...jobicyJobs);

  // 4. Fetch Remotive
  console.log('Fetching Remotive Software Dev...');
  const remotiveJobs = await fetchRemotive();
  allJobs.push(...remotiveJobs);

  // 30-Day TTL Cutoff: Filter out stale roles older than 30 days
  const MAX_JOB_AGE_DAYS = 30;
  const cutoffTime = Date.now() - (MAX_JOB_AGE_DAYS * 24 * 60 * 60 * 1000);

  // Deduplicate by title + company and enforce TTL
  const seen = new Set();
  const deduplicated = [];
  let staleCount = 0;

  for (const job of allJobs) {
    const jobTime = job.datePosted ? new Date(job.datePosted).getTime() : 0;
    if (jobTime && jobTime < cutoffTime) {
      staleCount++;
      continue;
    }

    const key = `${job.company.toLowerCase()}:${job.title.toLowerCase().trim()}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduplicated.push(job);
    }
  }

  console.log(`🧹 Pruned ${staleCount} stale jobs older than ${MAX_JOB_AGE_DAYS} days. Kept ${deduplicated.length} fresh roles.`);

  // Sort: newest first
  deduplicated.sort((a, b) => new Date(b.datePosted).getTime() - new Date(a.datePosted).getTime());

  // Company Diversity Interleaving (Fair round-robin so no single company dominates page 1)
  const interleavedJobs = interleaveJobsByCompany(deduplicated);

  // Load manual/featured jobs and pin them to the top (with 60-day expiry check)
  let featuredJobs = [];
  if (fs.existsSync(FEATURED_FILE)) {
    try {
      const raw = JSON.parse(fs.readFileSync(FEATURED_FILE, 'utf-8'));
      if (Array.isArray(raw)) {
        const featuredCutoff = Date.now() - (60 * 24 * 60 * 60 * 1000);
        featuredJobs = raw.filter(j => {
          if (j.expiresAt && new Date(j.expiresAt).getTime() < Date.now()) return false;
          const posted = j.datePosted ? new Date(j.datePosted).getTime() : 0;
          if (posted && posted < featuredCutoff) return false;
          return true;
        });
      }
    } catch (e) {
      console.warn('Could not read featured-jobs.json:', e.message);
    }
  }

  // Prepend featured jobs at the very top of the feed
  const combinedJobs = [...featuredJobs, ...interleavedJobs];

  // Ensure output directory exists
  const targetDir = path.dirname(TARGET_FILE);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.writeFileSync(TARGET_FILE, JSON.stringify(combinedJobs, null, 2), 'utf-8');

  console.log(`✅ Successfully synced ${combinedJobs.length} verified developer jobs (${featuredJobs.length} featured) to ${TARGET_FILE}!`);
  
  // Summary by region
  const stats = deduplicated.reduce((acc, j) => {
    acc[j.region] = (acc[j.region] || 0) + 1;
    return acc;
  }, {});
  console.log('📊 Regional Breakdown:', stats);
}

main().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});
