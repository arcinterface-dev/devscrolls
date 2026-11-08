export const SQL_PATTERNS = [
  (n: string) => `SELECT id, ${n}_name, created_at FROM users WHERE is_active = true ORDER BY created_at DESC LIMIT 50;`,
  (n: string) => `WITH ranked_${n} AS (SELECT id, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY score DESC) as rank FROM ${n})`,
  (n: string) => `UPDATE accounts SET balance = balance - 100 WHERE id = $1 AND status = 'ACTIVE' RETURNING id;`,
  (n: string) => `CREATE INDEX CONCURRENTLY idx_${n}_tenant_id ON ${n} (tenant_id, created_at DESC);`,
  (n: string) => `SELECT u.email, COUNT(o.id) as total_orders FROM users u LEFT JOIN orders o ON o.user_id = u.id GROUP BY u.id;`,
];

export const SQL_NAMES = ['orders', 'sessions', 'audit_logs', 'deployments', 'metrics', 'events'];
