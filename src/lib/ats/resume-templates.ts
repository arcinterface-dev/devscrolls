/**
 * ATS-Friendly Developer Resume Templates & Google X-Y-Z Action Formula Bank
 * Formatted to guarantee 95+ compatibility across Workday, Greenhouse, Lever, and Ashby.
 */

export interface XyzBullet {
  category: string;
  role: string;
  weak: string;
  strong: string;
  impactMetrics: string;
}

export const DEVELOPER_RESUME_MARKDOWN = `# FIRSTNAME LASTNAME
Senior Software Engineer | San Francisco, CA | Remote (US / Global)
alex.chen@example.com | +1 (555) 019-2834 | linkedin.com/in/yourprofile | github.com/yourusername

## PROFESSIONAL SUMMARY
Senior Software Engineer with 7+ years of experience architecting distributed frontend systems and high-throughput microservices. Specialized in TypeScript, React, Node.js, and cloud-native architectures. Track record of cutting P95 page load latencies by 70%+ and scaling resilient production systems to 1M+ active enterprise users.

## TECHNICAL SKILLS
- Languages: TypeScript, JavaScript (ES6+), Python, Go, SQL, HTML5, CSS3
- Frontend Ecosystem: React 19, Next.js, Vue.js, Tailwind CSS, Web Components, WebSockets, Web Workers
- Backend & Distributed: Node.js, Express, Koa, RESTful APIs, gRPC, GraphQL, Redis, BullMQ
- Databases: PostgreSQL, MySQL, MongoDB, Redis, Schema Design, Query Optimization
- Cloud & Infrastructure: AWS (ECS, S3, CloudFront, Lambda), Docker, Kubernetes, CI/CD, Terraform
- Architecture & Quality: System Design, Microfrontends, Jest, Vitest, Playwright, TDD

## WORK EXPERIENCE
### Senior Frontend Engineer | ScaleFlow Systems | Jan 2022 – Present | Remote
- Architected modular Next.js SSR architecture, improving Lighthouse performance scores from 42 to 96 across 1.2M monthly enterprise users.
- Reduced P95 First Contentful Paint (FCP) from 2.4s to 650ms (73% decrease) by introducing edge caching and streaming hydration.
- Spearheaded company-wide design system in Tailwind CSS and Web Components, accelerating cross-team feature velocity by 35%.
- Implemented automated end-to-end testing suite with Playwright and GitHub Actions, preventing 18 regression incidents across 4 production releases.
- Mentored 6 junior and mid-level engineers through weekly architecture reviews, increasing team PR merge velocity by 25%.

### Software Engineer | CloudVantage Inc. | Mar 2019 – Dec 2021 | San Francisco, CA
- Engineered real-time dashboard in React and TypeScript streaming 50,000 live metrics via WebSockets with zero frame drops.
- Optimized state management by migrating legacy Redux store to Zustand, eliminating unnecessary re-renders and reducing bundle size by 48kB.
- Automated frontend CI/CD deployment pipelines on AWS S3 and CloudFront, reducing release cycle time from 45 mins to 4 mins.
- Resolved memory leaks in Node.js event listeners and stream subscriptions, improving pod uptime to 99.98%.

### Full-Stack Developer | NexaTech Solutions | Jun 2017 – Feb 2019 | San Jose, CA
- Developed RESTful API endpoints in Node.js and PostgreSQL serving 200,000 daily active mobile users with sub-100ms response times.
- Designed database migration scripts and composite indexes, cutting slow query execution times by 62%.
- Integrated OAuth2 and JWT authentication mechanisms with Redis token revocation, securing multi-tenant enterprise accounts.

## KEY PROJECTS
### DailyScroll Open-Source Developer Companion | github.com/yourusername/dailyscroll
- Built local-first keyboard-driven developer companion in Astro and React. Over 1,500 GitHub stars and 8,000 active users.
- Engineered offline persistence layer with IndexedDB, delivering instantaneous sub-10ms query execution with zero cloud egress.

## EDUCATION
Bachelor of Science in Computer Science | University of California, Berkeley | 2013 – 2017
`;

export const DEVELOPER_RESUME_LATEX = `% ATS-Friendly Single-Column Software Engineer Resume Template
% Guaranteed single-column text layer without multi-column parsing traps
\\documentclass[10pt,letterpaper]{article}
\\usepackage[margin=0.6in]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{titlesec}

\\hypersetup{
    colorlinks=true,
    linkcolor=black,
    filecolor=black,      
    urlcolor=blue,
}

\\titleformat{\\section}{\\large\\bfseries}{}{0em}{}[\\titlerule]
\\titlespacing*{\\section}{0pt}{8pt}{4pt}
\\setlist[itemize]{leftmargin=1.5em, itemsep=2pt, topsep=2pt}

\\begin{document}
\\pagestyle{empty}

% HEADER
\\begin{center}
    {\\LARGE \\textbf{FIRSTNAME LASTNAME}} \\\\[3pt]
    Senior Software Engineer | San Francisco, CA | Remote (US / Global) \\\\[2pt]
    alex.chen@example.com | +1 (555) 019-2834 | \\href{https://linkedin.com/in/yourprofile}{linkedin.com/in/yourprofile} | \\href{https://github.com/yourusername}{github.com/yourusername}
\\end{center}

% SUMMARY
\\section*{PROFESSIONAL SUMMARY}
Senior Software Engineer with 7+ years of experience architecting distributed frontend systems and high-throughput microservices. Specialized in TypeScript, React, Node.js, and cloud-native architectures. Track record of cutting P95 page load latencies by 70\\%+ and scaling resilient production systems to 1M+ active enterprise users.

% SKILLS
\\section*{TECHNICAL SKILLS}
\\begin{itemize}
    \\item \\textbf{Languages:} TypeScript, JavaScript (ES6+), Python, Go, SQL, HTML5, CSS3
    \\item \\textbf{Frontend Ecosystem:} React 19, Next.js, Vue.js, Tailwind CSS, Web Components, WebSockets, Web Workers
    \\item \\textbf{Backend \\& Distributed:} Node.js, Express, Koa, RESTful APIs, gRPC, GraphQL, Redis, BullMQ
    \\item \\textbf{Databases \\& Storage:} PostgreSQL, MySQL, MongoDB, Redis, Schema Indexing, Query Optimization
    \\item \\textbf{Cloud \\& DevOps:} AWS (ECS, S3, CloudFront), Docker, Kubernetes, CI/CD, Terraform
\\end{itemize}

% EXPERIENCE
\\section*{WORK EXPERIENCE}
\\textbf{Senior Frontend Engineer} | ScaleFlow Systems \\hfill Jan 2022 -- Present \\\\[-2pt]
\\textit{Remote}
\\begin{itemize}
    \\item Architected modular Next.js SSR architecture, improving Lighthouse performance scores from 42 to 96 across 1.2M monthly enterprise users.
    \\item Reduced P95 First Contentful Paint (FCP) from 2.4s to 650ms (73\\% decrease) by introducing edge caching and streaming hydration.
    \\item Spearheaded company-wide design system in Tailwind CSS, accelerating cross-team feature velocity by 35\\%.
    \\item Implemented automated end-to-end testing suite with Playwright and GitHub Actions, preventing 18 regression incidents across 4 production releases.
\\end{itemize}

\\vspace{4pt}
\\textbf{Software Engineer} | CloudVantage Inc. \\hfill Mar 2019 -- Dec 2021 \\\\[-2pt]
\\textit{San Francisco, CA}
\\begin{itemize}
    \\item Engineered real-time dashboard in React and TypeScript streaming 50,000 live metrics via WebSockets with zero frame drops.
    \\item Optimized state management by migrating legacy Redux store to Zustand, eliminating unnecessary re-renders and reducing bundle size by 48kB.
    \\item Automated frontend CI/CD deployment pipelines on AWS S3 and CloudFront, reducing release cycle time from 45 mins to 4 mins.
\\end{itemize}

% PROJECTS
\\section*{KEY PROJECTS}
\\textbf{DailyScroll Open-Source Developer Companion} | \\href{https://github.com/yourusername/dailyscroll}{github.com/yourusername/dailyscroll}
\\begin{itemize}
    \\item Built local-first keyboard-driven developer companion in Astro and React. Over 1,500 GitHub stars and 8,000 active users.
    \\item Engineered offline persistence layer with IndexedDB, delivering instantaneous sub-10ms query execution with zero cloud egress.
\\end{itemize}

% EDUCATION
\\section*{EDUCATION}
\\textbf{Bachelor of Science in Computer Science} | University of California, Berkeley \\hfill 2013 -- 2017

\\end{document}
`;

export const GOOGLE_XYZ_CHEAT_SHEET: XyzBullet[] = [
  // 1. Frontend & Core Web Vitals
  {
    category: "Frontend & Performance",
    role: "Senior Frontend Engineer",
    weak: "Worked on performance optimization and migrated website to Next.js.",
    strong: "Reduced P95 First Contentful Paint (FCP) from 2.4s to 650ms (73% decrease) across 1.2M monthly users by migrating client-rendered routes to Next.js SSR with edge caching.",
    impactMetrics: "73% latency reduction, 1.2M users, P95 FCP"
  },
  {
    category: "Frontend & Performance",
    role: "UI Architect",
    weak: "Built a design system to help developers make components faster.",
    strong: "Engineered company-wide design system in TypeScript and Tailwind CSS, standardizing 45 UI components and accelerating cross-team sprint velocity by 35%.",
    impactMetrics: "35% sprint velocity increase, 45 standardized components"
  },
  {
    category: "Frontend & Performance",
    role: "Frontend Engineer",
    weak: "Reduced JavaScript bundle size and fixed code splitting.",
    strong: "Cut production JavaScript bundle size by 142kB (44% reduction) by isolating heavy visualization dependencies into dynamic imports and route-based code splitting.",
    impactMetrics: "44% bundle reduction, 142kB eliminated"
  },
  {
    category: "Frontend & Performance",
    role: "Senior React Developer",
    weak: "Handled WebSocket messages in dashboard without freezing the UI.",
    strong: "Prevented UI main-thread freezing during 100 msg/sec WebSocket bursts by buffering incoming packets in Web Workers and scheduling renders with requestAnimationFrame.",
    impactMetrics: "Zero frame drops at 100 msg/sec burst throughput"
  },
  {
    category: "Frontend & Performance",
    role: "Web Performance Specialist",
    weak: "Fixed Cumulative Layout Shift (CLS) issues across mobile landing pages.",
    strong: "Eliminated Cumulative Layout Shift (CLS score from 0.38 to 0.01) by enforcing explicit aspect-ratio container reservations and local self-hosted web font preloading.",
    impactMetrics: "CLS improved from 0.38 to 0.01 (97% stability gain)"
  },

  // 2. Backend & Distributed Microservices
  {
    category: "Backend & Systems",
    role: "Senior Backend Engineer",
    weak: "Improved API query times and added Redis caching.",
    strong: "Reduced P99 API response latency from 450ms to 42ms (90% drop) by implementing an in-memory Redis cluster with cache stampede mutex locks.",
    impactMetrics: "90% latency reduction, 42ms P99"
  },
  {
    category: "Backend & Systems",
    role: "Distributed Systems Lead",
    weak: "Built payment processing service to prevent duplicate charges.",
    strong: "Eliminated duplicate billing transactions across $12M in processed volume by architecting an atomic idempotency key validation layer using Redis SET NX EX.",
    impactMetrics: "Zero duplicate transactions across $12M volume"
  },
  {
    category: "Backend & Systems",
    role: "Full-Stack Engineer",
    weak: "Migrated monolith endpoints to Go microservices.",
    strong: "Scaled checkout throughput from 250 req/s to 2,800 req/s (11x increase) by decomposing monolithic Node.js billing routes into lightweight gRPC microservices in Go.",
    impactMetrics: "11x throughput increase, 2,800 req/s"
  },
  {
    category: "Backend & Systems",
    role: "API Platform Engineer",
    weak: "Handled slow third-party partner APIs with error timeouts.",
    strong: "Protected internal services from cascading outages by implementing the Circuit Breaker pattern with BullMQ fallback queues, maintaining 99.99% system availability.",
    impactMetrics: "99.99% uptime, zero cascading downtime"
  },
  {
    category: "Backend & Systems",
    role: "Senior Full-Stack Dev",
    weak: "Added authentication and revoked tokens when users logged out.",
    strong: "Architected distributed JWT revocation mechanism utilizing cryptographically unique jti identifiers and Redis TTLs, securing 500,000 multi-tenant active sessions.",
    impactMetrics: "500,000 secure sessions, O(1) verification"
  },

  // 3. Database & Storage Optimization
  {
    category: "Database & Data",
    role: "Database Engineer",
    weak: "Cleaned up slow database queries in PostgreSQL.",
    strong: "Reduced CPU utilization from 88% to 24% on primary PostgreSQL cluster by identifying unindexed foreign keys and restructuring N+1 ORM queries into composite joins.",
    impactMetrics: "64% CPU utilization decrease"
  },
  {
    category: "Database & Data",
    role: "Data Platform Architect",
    weak: "Migrated old database tables without downtime.",
    strong: "Executed zero-downtime database migration across 45 million order records using the Expand-and-Contract pattern with zero read/write service interruptions.",
    impactMetrics: "45M records migrated with 0 seconds downtime"
  },
  {
    category: "Database & Data",
    role: "Backend Architect",
    weak: "Fixed database connection pool errors during traffic spikes.",
    strong: "Prevented 504 Gateway Timeouts during Black Friday traffic surges by sizing connection pools via HikariCP and deploying PgBouncer connection multiplexing.",
    impactMetrics: "Zero connection dropouts under 10k concurrent users"
  },
  {
    category: "Database & Data",
    role: "Full-Stack Engineer",
    weak: "Added search functionality to our e-commerce catalog.",
    strong: "Accelerated product search query speeds from 1.8s to 85ms (95% improvement) by introducing Elasticsearch indexing with fuzzy matching across 250,000 SKUs.",
    impactMetrics: "95% search speedup across 250k items"
  },

  // 4. DevOps, Cloud & CI/CD
  {
    category: "Cloud & DevOps",
    role: "DevOps Engineer",
    weak: "Made our GitHub Actions CI/CD pipelines run faster.",
    strong: "Reduced CI/CD build and test pipeline duration from 42 minutes to 6 minutes (85% reduction) by introducing matrix test sharding and Docker layer caching.",
    impactMetrics: "85% pipeline time reduction (36 mins saved/build)"
  },
  {
    category: "Cloud & DevOps",
    role: "Site Reliability Engineer",
    weak: "Managed cloud infrastructure and cut AWS expenses.",
    strong: "Decreased monthly AWS infrastructure expenditure by $4,200 (32% savings) by right-sizing over-provisioned ECS instances and configuring S3 Intelligent-Tiering.",
    impactMetrics: "$50,400 annualized cost reduction (32% savings)"
  },
  {
    category: "Cloud & DevOps",
    role: "Cloud Architect",
    weak: "Moved services into Docker containers and Kubernetes.",
    strong: "Automated zero-downtime blue-green deployments on Kubernetes (EKS), reducing mean time to recovery (MTTR) from 28 minutes to 45 seconds.",
    impactMetrics: "MTTR cut from 28 mins to 45 seconds"
  },

  // 5. Engineering Leadership & Quality
  {
    category: "Leadership & Quality",
    role: "Engineering Lead",
    weak: "Helped junior developers and improved our code reviews.",
    strong: "Established standardized engineering RFC review process and mentored 5 junior engineers, driving automated test coverage from 58% to 92%.",
    impactMetrics: "34% test coverage increase, 5 engineers mentored"
  },
  {
    category: "Leadership & Quality",
    role: "Senior Engineer",
    weak: "Led incident response meetings when bugs broke production.",
    strong: "Authored 12 blameless production post-mortems and instituted automated synthetic monitoring, reducing monthly critical bug incidents by 68%.",
    impactMetrics: "68% reduction in production bug incidents"
  }
];
