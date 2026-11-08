export interface Archetype {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  parLength: number;
  generateMatch: () => string;
  generateReject: () => string;
}

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randNum(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

export const ARCHETYPES: Archetype[] = [
  // 1. Email addresses
  {
    id: 'emails',
    name: 'Work Emails',
    difficulty: 'easy',
    description: 'Match valid email addresses while rejecting web domains and malformed text.',
    parLength: 4,
    generateMatch: () => `${rand(['dev', 'alex', 'sarah', 'eng', 'admin'])}@${rand(['google.com', 'stripe.io', 'vercel.app', 'devscrolls.dev'])}`,
    generateReject: () => `${rand(['dev.google.com', 'alex@@corp', 'sarah.io', 'mailto://admin', 'user@'])}`,
  },

  // 2. IPv4
  {
    id: 'ipv4',
    name: 'IPv4 Addresses',
    difficulty: 'medium',
    description: 'Match valid dotted-quad IPv4 addresses and reject port numbers or hostnames.',
    parLength: 7,
    generateMatch: () => `${randNum(10, 192)}.${randNum(0, 255)}.${randNum(0, 255)}.${randNum(1, 254)}`,
    generateReject: () => `${rand(['192.168.1', '256.1.1.1', '10.0.0.999', 'localhost', '127.0.0.1:8080'])}`,
  },

  // 3. Hex Colors
  {
    id: 'hex-colors',
    name: 'Hex Color Codes',
    difficulty: 'easy',
    description: 'Match 3 or 6-digit hex color codes with # prefix.',
    parLength: 4,
    generateMatch: () => `#${rand(['fff', '000', '3b82f6', 'ef4444', '10b981', 'faf', '1e293b'])}`,
    generateReject: () => `${rand(['fff', '12345', '#12', '#ggg', '#1234567', 'rgb(0,0,0)'])}`,
  },

  // 4. Semantic Versions
  {
    id: 'semver',
    name: 'SemVer Releases',
    difficulty: 'easy',
    description: 'Match standard SemVer formats like v1.4.2 or 2.0.0.',
    parLength: 5,
    generateMatch: () => `v${randNum(0, 5)}.${randNum(0, 19)}.${randNum(0, 99)}`,
    generateReject: () => `${rand(['1.0', 'v2', 'alpha-1', 'v1.2.3.4', 'release-final', 'v.1.0'])}`,
  },

  // 5. Unix Paths
  {
    id: 'file-paths',
    name: 'Absolute Unix Paths',
    difficulty: 'medium',
    description: 'Match absolute Unix paths starting with / and reject relative or Windows paths.',
    parLength: 4,
    generateMatch: () => `/${rand(['etc', 'var', 'usr', 'home'])}/${rand(['nginx', 'log', 'bin', 'dev'])}/${rand(['config.json', 'app.log', 'main.go'])}`,
    generateReject: () => `${rand(['./src/index.ts', 'C:\\Windows\\System32', '../config.yaml', 'home/user/file', 'D:\\app'])}`,
  },

  // 6. HTTPS URLs
  {
    id: 'https-urls',
    name: 'Secure HTTPS URLs',
    difficulty: 'easy',
    description: 'Match HTTPS URLs and reject insecure HTTP or FTP links.',
    parLength: 5,
    generateMatch: () => `https://${rand(['api', 'docs', 'auth'])}.${rand(['devscrolls.dev', 'github.com', 'cloudflare.com'])}/${rand(['v1', 'articles', 'health'])}`,
    generateReject: () => `${rand(['http://insecure.site', 'ftp://files.org', 'ws://socket.io', 'file:///tmp/app', 'gopher://old'])}`,
  },

  // 7. camelCase Identifiers
  {
    id: 'camel-case',
    name: 'camelCase Identifiers',
    difficulty: 'medium',
    description: 'Match valid camelCase variables (starts lowercase, contains uppercase, no underscores).',
    parLength: 6,
    generateMatch: () => `${rand(['user', 'item', 'session', 'current', 'max'])}${rand(['Id', 'Count', 'Status', 'Record', 'List'])}`,
    generateReject: () => `${rand(['user_id', 'SessionToken', 'API_KEY', 'item-count', 'record_2', 'CONSTANT_VAL'])}`,
  },

  // 8. ISO Dates
  {
    id: 'iso-dates',
    name: 'ISO Date Strings',
    difficulty: 'medium',
    description: 'Match YYYY-MM-DD calendar dates and reject US slash formats.',
    parLength: 6,
    generateMatch: () => `202${randNum(4, 6)}-0${randNum(1, 9)}-${randNum(10, 28)}`,
    generateReject: () => `${rand(['10/24/2026', '24-10-2026', '2026/10/24', 'Jan 15, 2026', '2026.10.24', '99-99-99'])}`,
  },

  // 9. CSS Classes vs IDs
  {
    id: 'css-classes',
    name: 'CSS Class Selectors',
    difficulty: 'easy',
    description: 'Match CSS class selectors (.class-name) while rejecting IDs (#id) and elements.',
    parLength: 3,
    generateMatch: () => `.${rand(['btn', 'card', 'navbar', 'modal', 'container', 'hero'])}-${rand(['primary', 'active', 'lg', 'wrap', 'dark'])}`,
    generateReject: () => `${rand(['#header', 'div.active', '#modal-root', 'section', 'button[disabled]', '::before'])}`,
  },

  // 10. MAC Addresses
  {
    id: 'mac-addresses',
    name: 'Hardware MAC Addresses',
    difficulty: 'hard',
    description: 'Match colon-separated hardware MAC addresses like 00:1A:2B:3C:4D:5E.',
    parLength: 9,
    generateMatch: () => `${rand(['00', '1A', '3C'])}:${rand(['2B', '4D', 'FF'])}:${rand(['5E', '6A', '88'])}:${rand(['7C', '99', '11'])}:${rand(['8D', 'AA', '0F'])}:${rand(['9E', 'BB', 'CC'])}`,
    generateReject: () => `${rand(['00-1A-2B-3C-4D-5E', '00:1A:2B:3C:4D', '00:1A:2B:3C:4D:5E:6F', '192.168.1.1', '00:GG:2B:3C:4D:5E'])}`,
  },

  // 11. SQL Keywords
  {
    id: 'sql-keywords',
    name: 'SQL Reserved Keywords',
    difficulty: 'hard',
    description: 'Match exact uppercase SQL DDL/DML keywords and reject table columns.',
    parLength: 8,
    generateMatch: () => rand(['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'JOIN', 'WHERE', 'GROUP BY', 'HAVING']),
    generateReject: () => rand(['select_all', 'user_id', 'where_clause', 'updated_at', 'join_table', 'is_active']),
  },

  // 12. Valid JS Variables
  {
    id: 'valid-variables',
    name: 'Valid JS Identifiers',
    difficulty: 'medium',
    description: 'Match valid JavaScript identifier names and reject names starting with digits or hyphens.',
    parLength: 5,
    generateMatch: () => rand(['$el', '_cache', 'userName', 'items42', '__init__', 'processEnv']),
    generateReject: () => rand(['42items', 'user-name', 'item count', 'const', 'var.name', '@token']),
  },
];
