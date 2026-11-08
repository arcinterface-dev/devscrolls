export interface TestResult {
  isValid: boolean;
  error?: string;
  isSlow?: boolean;
  matches: boolean[];
}

export function safeCompileRegex(pattern: string, flags: string = ''): { regex: RegExp | null; error?: string } {
  if (!pattern) return { regex: null };
  try {
    const regex = new RegExp(pattern, flags);
    return { regex };
  } catch (err: any) {
    return { regex: null, error: err.message || 'Invalid Regular Expression' };
  }
}

export function testStringsSafely(
  pattern: string,
  flags: string,
  strings: string[],
  timeoutMs: number = 50
): { results: boolean[]; isSlow: boolean; error?: string } {
  if (!pattern) {
    return { results: strings.map(() => false), isSlow: false };
  }

  const { regex, error } = safeCompileRegex(pattern, flags);
  if (!regex) {
    return { results: strings.map(() => false), isSlow: false, error };
  }

  const results: boolean[] = [];
  let isSlow = false;

  for (const str of strings) {
    const start = performance.now();
    try {
      const matched = regex.test(str);
      const elapsed = performance.now() - start;
      if (elapsed > timeoutMs) {
        isSlow = true;
      }
      results.push(matched);
    } catch {
      results.push(false);
    }
  }

  return { results, isSlow };
}
