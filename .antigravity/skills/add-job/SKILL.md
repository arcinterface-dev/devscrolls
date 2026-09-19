---
name: add-job
description: >
  Invoke whenever the user pastes a job submission email (from Formspree) or asks to 
  add, publish, or feature a new job on the DevScrolls Job Board (/jobs/).
  Parses the email text, runs anti-fraud validation, saves to src/data/featured-jobs.json,
  and publishes the role to the live static feed.
inputs:
  - emailText: The raw text of the job submission email or details provided by the user.
---

# Add & Publish Job Skill (`add-job`)

This skill automates publishing manually submitted or sponsored developer jobs to the DevScrolls Job Board.

## Anti-Fraud & Quality Checklist (Must Verify Before Adding)

1. **Work Email Domain Check**:
   - The submitter's email address MUST match the company's domain (e.g. `alex@linear.app` for Linear).
   - REJECT consumer webmail: `@gmail.com`, `@yahoo.com`, `@outlook.com`, `@hotmail.com`, `@proton.me`, etc.
2. **Direct Career URL Check**:
   - The application link MUST point to the company's official domain (`https://company.com/careers/...`) or an approved ATS (`boards.greenhouse.io`, `jobs.lever.co`, `jobs.ashbyhq.com`, `apply.workable.com`).
   - REJECT URL shorteners (`bit.ly`, `tinyurl.com`, `t.co`) or third-party recruiter links.

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
- **Salary Range**: e.g., "$160,000 – $190,000 USD" (optional)
- **Tech Stack**: Comma-separated tags (e.g., "React, TypeScript, Node.js")
- **Direct Application URL**: Direct career or ATS link
- **Role Summary**: Description snippet

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
  "salary": "<Salary or undefined>",
  "applyUrl": "<Direct Application URL>",
  "datePosted": "<Current ISO Timestamp>",
  "source": "Featured Employer",
  "descriptionSnippet": "<2-3 sentence role summary>"
}
```

### Step 3: Append to `src/data/featured-jobs.json`
- Read `src/data/featured-jobs.json` (initialize as `[]` if missing).
- Prepend the new job object to the array so featured roles always appear at the top.
- Write back to `src/data/featured-jobs.json`.

### Step 4: Sync & Build
Run terminal commands:
```bash
npm run sync:jobs
npm run build
```

### Step 5: Report to User
Provide a formatted confirmation showing:
- Role title and company
- Verified work email domain
- Assigned tags and region
- Status: **Live at `/jobs/`**
