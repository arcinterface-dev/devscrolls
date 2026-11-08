export const TS_PATTERNS = [
  (n: string, t: string, v: string) => `const ${n}: ${t} = ${v};`,
  (n: string, p: string, r: string) => `export async function get${capitalize(n)}(${p}): Promise<${r}> {`,
  (n: string, k: string) => `type ${capitalize(n)}Map = Record<string, ${capitalize(k)}>;`,
  (n: string, t: string) => `const [${n}, set${capitalize(n)}] = useState<${t}>(null);`,
  (a: string, b: string) => `const filtered = ${a}.filter((item) => item.${b} !== undefined);`,
  (n: string, f: string) => `const { ${n}, ...rest } = await ${f}();`,
  (n: string) => `interface ${capitalize(n)}Props { id: string; active: boolean; }`,
  (a: string, b: string) => `return items.reduce((acc, curr) => acc + curr.${a}, 0);`,
  (n: string) => `if (!response.ok) throw new Error(\`Failed to fetch \${${n}}\`);`,
  (n: string, t: string) => `const cache = new Map<string, ${t}>();`,
];

export const TS_NAMES = ['config', 'payload', 'session', 'user', 'metrics', 'context', 'records', 'stream', 'handler'];
export const TS_TYPES = ['string', 'number', 'boolean', 'Record<string, unknown>', 'UserSession', 'ApiResponse', 'Promise<void>'];
export const TS_VALUES = ['await fetch("/api/v1/health")', 'new Map()', 'JSON.parse(raw)', 'null', 'Date.now()'];
export const TS_PARAMS = ['id: string, options?: RequestInit', 'token: string', 'ctx: AppContext'];
export const TS_RETURNS = ['ApiResponse', 'UserSession', 'Promise<boolean>', 'void'];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
