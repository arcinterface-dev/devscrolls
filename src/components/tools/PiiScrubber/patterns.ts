/**
 * Comprehensive PII & Secret Redaction Patterns
 * 
 * Each pattern defines:
 * - id: unique key for filter toggles
 * - label: human readable display name
 * - description: what it identifies
 * - category: 'secret' | 'pii' | 'network'
 * - regex: matching expression
 * - mask: replacement tag (e.g. [REDACTED_API_KEY])
 */

export interface PatternRule {
  id: string;
  label: string;
  description: string;
  category: 'secret' | 'pii' | 'infrastructure';
  mask: string;
  regex: RegExp;
  color: string;
}

export const PII_PATTERNS: PatternRule[] = [
  {
    id: 'jwt',
    label: 'JWT Tokens',
    description: 'JSON Web Tokens with full Header.Payload.Signature structure',
    category: 'secret',
    mask: '[REDACTED_JWT]',
    regex: /\beyJ[A-Za-z0-9-_]{10,}\.eyJ[A-Za-z0-9-_]{10,}\.[A-Za-z0-9-_.+/=]{10,}={0,2}\b/g,
    color: '#8b5cf6'
  },
  {
    id: 'openai_key',
    label: 'OpenAI API Keys',
    description: 'OpenAI secret keys (sk-... or sk-proj-...)',
    category: 'secret',
    mask: '[REDACTED_OPENAI_KEY]',
    regex: /\b(sk-(?:proj-)?[A-Za-z0-9_-]{32,})\b/g,
    color: '#10b981'
  },
  {
    id: 'stripe_key',
    label: 'Stripe Secret/Publishable Keys',
    description: 'Stripe live & test API keys (sk_live, pk_live, etc.)',
    category: 'secret',
    mask: '[REDACTED_STRIPE_KEY]',
    regex: /\b(?:sk|pk)_(?:live|test)_[0-9a-zA-Z]{24,}\b/g,
    color: '#6366f1'
  },
  {
    id: 'aws_access_key',
    label: 'AWS Access Key ID',
    description: 'AWS 20-character Access Key IDs starting with AKIA/ASIA',
    category: 'secret',
    mask: '[REDACTED_AWS_KEY]',
    regex: /\b(?:AKIA|ASIA|AROA)[0-9A-Z]{16}\b/g,
    color: '#f59e0b'
  },
  {
    id: 'aws_secret_key',
    label: 'AWS Secret Key',
    description: '40-character base64 secret access keys',
    category: 'secret',
    mask: '[REDACTED_AWS_SECRET]',
    regex: /(?:aws_secret_access_key|aws_secret_key|secret_key|aws_secret)\s*[:=]\s*["']?([A-Za-z0-9/+=]{40})["']?/gi,
    color: '#f97316'
  },
  {
    id: 'github_token',
    label: 'GitHub Tokens',
    description: 'Personal Access Tokens and OAuth credentials (ghp_, github_pat_)',
    category: 'secret',
    mask: '[REDACTED_GITHUB_TOKEN]',
    regex: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,}\b|\bgithub_pat_[A-Za-z0-9_]{82}\b/g,
    color: '#22c55e'
  },
  {
    id: 'slack_token',
    label: 'Slack Bot & User Tokens',
    description: 'Slack API tokens (xoxb-, xoxp-, etc.)',
    category: 'secret',
    mask: '[REDACTED_SLACK_TOKEN]',
    regex: /\bxox[baprs]-[0-9a-zA-Z]{10,48}\b/g,
    color: '#ec4899'
  },
  {
    id: 'db_connection',
    label: 'Database Connection Strings',
    description: 'PostgreSQL, MongoDB, MySQL, Redis URLs with embedded passwords',
    category: 'infrastructure',
    mask: '[REDACTED_DATABASE_URL]',
    regex: /\b(?:postgres(?:ql)?|mongodb(?:\+srv)?|mysql|redis):\/\/[^:\s'"]+:[^@\s'"]+@[^\s"'?#]+\b/g,
    color: '#ef4444'
  },
  {
    id: 'private_key',
    label: 'Private Cryptographic Keys',
    description: 'RSA, EC, OpenSSH, and DSA private key blocks',
    category: 'secret',
    mask: '[REDACTED_PRIVATE_KEY_BLOCK]',
    regex: /-----BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY-----[\s\S]*?-----END (?:[A-Z0-9_-]+ )?PRIVATE KEY-----/g,
    color: '#dc2626'
  },
  {
    id: 'bearer_token',
    label: 'Bearer / Auth Headers',
    description: 'Authorization: Bearer <token> headers',
    category: 'secret',
    mask: 'Bearer [REDACTED_AUTH_TOKEN]',
    regex: /Bearer\s+([A-Za-z0-9-._~+/]+=*)/gi,
    color: '#d97706'
  },
  {
    id: 'email',
    label: 'Email Addresses',
    description: 'Customer or personal email addresses (RFC 5322)',
    category: 'pii',
    mask: '[REDACTED_EMAIL]',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    color: '#3b82f6'
  },
  {
    id: 'ipv4',
    label: 'IPv4 Addresses',
    description: 'Public or private IP addresses (excludes localhost 127.0.0.1)',
    category: 'infrastructure',
    mask: '[REDACTED_IPV4]',
    regex: /\b(?!127\.0\.0\.1|0\.0\.0\.0)(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b/g,
    color: '#06b6d4'
  },
  {
    id: 'credit_card',
    label: 'Credit Card Numbers',
    description: 'Visa, MasterCard, Amex, Discover 13-16 digit numbers',
    category: 'pii',
    mask: '[REDACTED_CARD_NUMBER]',
    regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
    color: '#e11d48'
  },
  {
    id: 'phone',
    label: 'Phone Numbers',
    description: 'International and national phone format variations',
    category: 'pii',
    mask: '[REDACTED_PHONE]',
    regex: /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g,
    color: '#14b8a6'
  }
];

export interface ScrubResult {
  scrubbedText: string;
  totalRedactions: number;
  categoryCounts: Record<string, number>;
  detectedIds: string[];
}

/**
 * Execute regex redactions across input string based on active pattern rules.
 */
export function scrubPii(
  input: string,
  activePatternIds: Set<string>
): ScrubResult {
  if (!input) {
    return {
      scrubbedText: '',
      totalRedactions: 0,
      categoryCounts: {},
      detectedIds: []
    };
  }

  let text = input;
  let totalRedactions = 0;
  const categoryCounts: Record<string, number> = {};
  const detectedIds: string[] = [];

  for (const pattern of PII_PATTERNS) {
    if (!activePatternIds.has(pattern.id)) continue;

    // Reset regex state
    pattern.regex.lastIndex = 0;
    
    let matchesFound = 0;
    text = text.replace(pattern.regex, (match, p1) => {
      matchesFound++;
      // Handle captured group if regex specifies one (e.g. Bearer tokens or AWS keys in key-value pairs)
      if (p1 && match.includes(p1) && pattern.mask.startsWith('Bearer')) {
        return `Bearer [REDACTED_AUTH_TOKEN]`;
      }
      if (p1 && match.includes(p1) && pattern.id === 'aws_secret_key') {
        return match.replace(p1, '[REDACTED_AWS_SECRET]');
      }
      return pattern.mask;
    });

    if (matchesFound > 0) {
      categoryCounts[pattern.id] = matchesFound;
      totalRedactions += matchesFound;
      detectedIds.push(pattern.id);
    }
  }

  return {
    scrubbedText: text,
    totalRedactions,
    categoryCounts,
    detectedIds
  };
}

export const SAMPLE_DIRTY_LOG = `[2026-09-20 10:14:02.329] INFO  auth-service: Received user login request for user=alex.dev@acme-corp.com from ip=198.51.100.42 (phone: +1-415-555-0199)
[2026-09-20 10:14:02.401] DEBUG oauth-provider: Generated session JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFsZXgiLCJyb2xlIjoiYWRtaW4iLCJleHAiOjE3OTA4NTI4MDB9.dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
[2026-09-20 10:14:02.512] WARN  db-cluster: Reconnecting secondary pool with uri: postgres://admin:SuperSecretPass99!@db-prod-cluster.internal:5432/customers
[2026-09-20 10:14:02.610] ERROR ai-pipeline: OpenAI API request timed out using key sk-proj-abC123def456GHI789jkl012MNO345PQR678stu901vwx
[2026-09-20 10:14:02.689] DEBUG s3-uploader: Uploading crash dump with AWS credentials:
  aws_access_key_id = AKIAIOSFODNN7EXAMPLE
  aws_secret_access_key = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
[2026-09-20 10:14:02.730] INFO  payment-gateway: Refund issued for card 4532015012349876, customer email: billing-alerts@techcorp.io
[2026-09-20 10:14:02.800] DEBUG github-sync: Synced release using token ghp_A1b2C3d4E5f6G7h8I9j0K1L2M3N4O5P6Q7R8
[2026-09-20 10:14:02.915] DEBUG api-gateway: Inbound header Authorization: Bearer dGVzdC1hdXRoLXRva2VuLTEyMzQ1Njc4OTA=`;
