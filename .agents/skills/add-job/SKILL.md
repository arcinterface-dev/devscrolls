---
name: add-job
description: >
  Invoke whenever the user pastes a job submission email (from Formspree or direct text)
  or says keywords like "add job", "publish job", "new job listing", or "make it live".
  Automatically parses email/text fields, enforces anti-fraud checks, saves to
  src/data/featured-jobs.json, and runs sync & build to publish the job immediately to /jobs/.
inputs:
  - emailText: The raw text of the job submission email or details provided by the user.
---

# Add & Publish Job Skill (`add-job`)

This skill automates publishing verified employer job submissions to the DevScrolls Job Board (`/jobs/`).

## Triggers & Keywords
This skill triggers automatically when the user:
- Pastes an email or notification from Formspree / `santhanakrishnanstark@gmail.com`
- Says keywords like: `add job`, `publish job`, `make it live`, `post this role`, `new job listing`, `approve job`

---

## Anti-Fraud & Quality Checklist (Must Verify Before Adding)

1. **Work Email Domain Check**:
   - The submitter's email domain MUST match the hiring company (e.g., `recruiter@stripe.com` for Stripe).
   - REJECT consumer webmail: `@gmail.com`, `@yahoo.com`, `@outlook.com`, `@hotmail.com`, `@proton.me`, etc.
2. **Direct Career / ATS URL Check**:
   - The application link MUST point to the company's official careers portal (`https://company.com/careers/...`) or an approved ATS (`boards.greenhouse.io`, `jobs.lever.co`, `jobs.ashbyhq.com`, `apply.workable.com`).
   - REJECT URL shorteners (`bit.ly`, `tinyurl.com`, `t.co`) or third-party scraper links.
3. **Region & Remote Check**:
   - Must be Remote (or Hybrid/On-site) targeting US, EU, Canada, or Worldwide.

---

## Execution Steps

### Step 1: Parse the Email Content
Extract the following fields from the user's message:
- **Company Name**: e.g., "Linear"
- **Company Website**: e.g., "https://linear.app"
- **Work Email**: e.g., "alex@linear.app"
- **Job Title**: e.g., "Senior Full-Stack Engineer"
- **Region**: `US` | `EU` | `Canada` | `Worldwide`
- **Workplace Type**: `Remote` | `Hybrid` | `On-site`
- **Salary Range**: e.g., "$160,000 – $190,000 USD" (or empty string if not provided)
- **Tech Stack**: Array of strings (e.g., `["React", "TypeScript", "Node.js"]`)
- **Direct Application URL**: Direct career or ATS link
- **Role Summary**: 2-3 sentence role summary

### Step 2: Construct the Structured Job Object
```json
{
  "id": "featured-<company-slug>-<title-slug>",
  "slug": "<company-slug>-<title-slug>",
  "title": "<Job Title>",
  "company": "<Company Name>",
  "companyLogo": "https://www.google.com/s2/favicons?sz=128&domain=<company-domain>",
  "location": "Remote (<Region>)",
  "region": "<US | EU | Canada | Worldwide>",
  "workplaceType": "<Remote | Hybrid | On-site>",
  "tags": ["<Stack Tag 1>", "<Stack Tag 2>", "<Seniority>"],
  "salary": "<Salary or empty string>",
  "applyUrl": "<Direct Application URL>",
  "datePosted": "<Current ISO Timestamp e.g. 2026-09-19T00:00:00.000Z>",
  "source": "Featured Employer",
  "descriptionSnippet": "<2-3 sentence role summary>"
}
```

### Step 3: Append to `src/data/featured-jobs.json`
- Read `src/data/featured-jobs.json` (initialize as `[]` if empty).
- Prepend the new job object to the top of the array so featured roles always appear first.
- Save `src/data/featured-jobs.json`.

### Step 4: Sync & Rebuild
Run in the terminal:
```bash
node scripts/sync-jobs.js
npm run build
```

### Step 5: Report to User
Show a clean summary card:
- **Company & Role**: e.g. `Linear — Senior Full-Stack Engineer`
- **Region & Stack**: e.g. `US Remote | React, TypeScript, Node.js`
- **Verification**: Work email domain verified (`alex@linear.app`)
- **Status**: Live on [DevScrolls Job Board](http://localhost:4321/jobs/)
