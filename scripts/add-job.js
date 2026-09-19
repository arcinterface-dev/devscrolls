import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FEATURED_FILE = path.join(__dirname, '../src/data/featured-jobs.json');

/**
 * Validates and adds a new featured/sponsored job to featured-jobs.json,
 * then triggers sync and build.
 */
export function addFeaturedJob(job) {
  // 1. Basic validation
  if (!job.company || !job.title || !job.applyUrl) {
    throw new Error('Missing required fields: company, title, and applyUrl are mandatory.');
  }

  // 2. Anti-fraud checks
  const consumerDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'proton.me', 'icloud.com', 'aol.com'];
  if (job.workEmail) {
    const emailDomain = job.workEmail.split('@')[1]?.toLowerCase().trim();
    if (consumerDomains.includes(emailDomain)) {
      throw new Error(`Security Alert: Work email "${job.workEmail}" uses a consumer domain. Only corporate emails matching the company domain are allowed.`);
    }
  }

  // Application URL validation
  const bannedShorteners = ['bit.ly', 'tinyurl.com', 't.co', 'ow.ly', 'is.gd', 'buff.ly', 'rebrand.ly'];
  try {
    const parsedUrl = new URL(job.applyUrl);
    if (bannedShorteners.some(s => parsedUrl.hostname.includes(s))) {
      throw new Error(`Security Alert: Application URL "${job.applyUrl}" uses a URL shortener. Direct company careers or ATS URLs are required.`);
    }
  } catch (e) {
    if (e.message.startsWith('Security Alert')) throw e;
    throw new Error(`Invalid application URL: "${job.applyUrl}"`);
  }

  // 3. Normalize fields
  const companySlug = job.company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const titleSlug = job.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const id = `featured-${companySlug}-${titleSlug}-${Date.now().toString(36)}`;

  // Google Favicon API for company logo
  let domain = '';
  try {
    if (job.companyWebsite) {
      domain = new URL(job.companyWebsite).hostname;
    } else if (job.applyUrl) {
      domain = new URL(job.applyUrl).hostname;
    }
  } catch {
    // fallback
  }

  // Format salary with currency if provided separately
  let formattedSalary = job.salary ? job.salary.trim() : undefined;
  if (formattedSalary && job.currency && job.currency !== 'Other') {
    const currCode = job.currency.split(' ')[0]; // e.g. "INR", "EUR", "USD"
    if (!formattedSalary.includes(currCode) && !formattedSalary.includes(currCode.slice(0, 1))) {
      formattedSalary = `${formattedSalary} ${currCode}`;
    }
  }

  // Format location
  let formattedLocation = job.location;
  if (!formattedLocation) {
    if (job.locationDetails) {
      formattedLocation = `${job.workplaceType || 'Remote'} — ${job.locationDetails}`;
    } else {
      formattedLocation = `${job.workplaceType || 'Remote'} (${job.region || 'Worldwide'})`;
    }
  }

  const newJob = {
    id,
    slug: `${companySlug}-${titleSlug}`,
    title: job.title.trim(),
    company: job.company.trim(),
    companyLogo: domain ? `https://www.google.com/s2/favicons?sz=128&domain=${domain}` : undefined,
    location: formattedLocation,
    region: job.region || 'Worldwide',
    workplaceType: job.workplaceType || 'Remote',
    tags: Array.isArray(job.tags) ? job.tags : (typeof job.tags === 'string' ? job.tags.split(',').map(t => t.trim()).filter(Boolean) : []),
    salary: formattedSalary,
    applyUrl: job.applyUrl.trim(),
    datePosted: job.datePosted || new Date().toISOString(),
    source: 'Featured Employer',
    descriptionSnippet: job.descriptionSnippet ? job.descriptionSnippet.trim() : `Exciting ${job.title} opportunity at ${job.company}.`
  };

  // 4. Read & prepend to featured-jobs.json
  let existing = [];
  if (fs.existsSync(FEATURED_FILE)) {
    try {
      existing = JSON.parse(fs.readFileSync(FEATURED_FILE, 'utf-8'));
      if (!Array.isArray(existing)) existing = [];
    } catch {
      existing = [];
    }
  }

  // Deduplicate by company + title
  const filtered = existing.filter(j => 
    !(j.company.toLowerCase() === newJob.company.toLowerCase() && j.title.toLowerCase() === newJob.title.toLowerCase())
  );

  const updated = [newJob, ...filtered];
  fs.writeFileSync(FEATURED_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  console.log(`✅ Saved "${newJob.title}" at "${newJob.company}" to ${FEATURED_FILE}`);

  return newJob;
}

// CLI usage: node scripts/add-job.js '<json-string>'
if (process.argv[1] === fileURLToPath(import.meta.url) && process.argv[2]) {
  try {
    const raw = process.argv[2];
    const parsed = JSON.parse(raw);
    const result = addFeaturedJob(parsed);
    console.log('Running sync...');
    execSync('node scripts/sync-jobs.js', { stdio: 'inherit' });
    console.log('Building site...');
    execSync('npm run build', { stdio: 'inherit' });
    console.log(`\n🎉 Successfully published live: ${result.title} at ${result.company}!`);
  } catch (err) {
    console.error('Error adding job:', err.message);
    process.exit(1);
  }
}
