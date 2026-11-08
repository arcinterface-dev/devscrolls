export interface IncidentScenario {
  id: string;
  title: string;
  system: string;
  rootCause: string;
  severity: string;
  category: 'database' | 'network' | 'application' | 'security' | 'devops';
  keywords: string[];
}

export const INCIDENT_SCENARIOS: IncidentScenario[] = [
  {
    id: 'db-pool-exhausted',
    title: 'Database Connection Pool Exhausted',
    system: 'User Authentication Service',
    rootCause: 'Unindexed query on users table during peak traffic spike',
    severity: 'P1 — Complete authentication outage',
    category: 'database',
    keywords: ['pool', 'connection', 'database', 'postgres', 'query', 'auth'],
  },
  {
    id: 'ssl-cert-expired',
    title: 'SSL Certificate Expired on Payment Gateway',
    system: 'Stripe Webhook Ingestion',
    rootCause: 'Cert-manager renewal cron failed silently due to expired token',
    severity: 'P1 — Transactions failing checkout worldwide',
    category: 'security',
    keywords: ['ssl', 'cert', 'certificate', 'tls', 'expire', 'payment'],
  },
  {
    id: 'dns-propagation-loop',
    title: 'DNS Propagation Black Hole',
    system: 'Global Edge Ingress',
    rootCause: 'Negative TTL set to 24h during Cloudflare registrar transfer',
    severity: 'P2 — Intermittent 502 Bad Gateway across Europe',
    category: 'network',
    keywords: ['dns', 'ttl', 'cloudflare', 'domain', 'nameserver'],
  },
  {
    id: 'redis-oom-meltdown',
    title: 'Redis Cache Out Of Memory (OOM)',
    system: 'Session Storage Cluster',
    rootCause: 'Unbounded cart serialization without TTL expiration keys',
    severity: 'P1 — 100,000 active sessions evicted instantly',
    category: 'database',
    keywords: ['redis', 'cache', 'oom', 'memory', 'session'],
  },
  {
    id: 'api-key-leak',
    title: 'AWS Production Credentials Leaked',
    system: 'Core Infrastructure',
    rootCause: 'Developer pushed .env file containing root access keys to public repo',
    severity: 'P0 — Immediate credentials revocation and lock-down',
    category: 'security',
    keywords: ['aws', 'key', 'credentials', 'github', 'leak', 'secret'],
  },
  {
    id: 'infinite-retry-loop',
    title: 'Self-Inflicted DDoS via Infinite Retry',
    system: 'Mobile Client API Gateway',
    rootCause: 'Exponential backoff bug reset delay to 0ms on HTTP 429 errors',
    severity: 'P1 — 2.4 million requests/sec cascading across pods',
    category: 'application',
    keywords: ['retry', 'ddos', 'backoff', '429', 'rate limit', 'mobile'],
  },
  {
    id: 'k8s-oom-killed',
    title: 'Kubernetes Pod OOMKilled Cascading Crash',
    system: 'Search Indexing Service',
    rootCause: 'Memory limit set to 512Mi while JVM heap configured for 2Gi',
    severity: 'P2 — Search queries failing or degrading to 15s latency',
    category: 'devops',
    keywords: ['k8s', 'kubernetes', 'pod', 'oom', 'memory', 'jvm'],
  },
  {
    id: 'regex-catastrophic-backtrack',
    title: 'ReDoS Catastrophic Backtracking Hang',
    system: 'Input Validation Middleware',
    rootCause: 'Evil regex matching nested parenthesis pegging NodeJS event loop at 100%',
    severity: 'P1 — All express worker threads completely frozen',
    category: 'application',
    keywords: ['regex', 'redos', 'backtracking', 'event loop', 'hang'],
  },
  {
    id: 'corrupt-migration',
    title: 'Irreversible Schema Migration Deadlock',
    system: 'Billing and Invoices DB',
    rootCause: 'ALTER TABLE on 40M-row table locked exclusive table write lock for 12m',
    severity: 'P1 — All write transactions timed out and queued up',
    category: 'database',
    keywords: ['migration', 'lock', 'deadlock', 'alter table', 'schema'],
  },
  {
    id: 'docker-tag-latest',
    title: 'Stale Build Deployed via Docker latest Tag',
    system: 'Notification Dispatcher',
    rootCause: 'CI pulled cached docker image from 3 months ago due to unpinned hash',
    severity: 'P2 — Outdated notification payloads sent to 50k customers',
    category: 'devops',
    keywords: ['docker', 'latest', 'image', 'tag', 'ci', 'cache'],
  },
];
