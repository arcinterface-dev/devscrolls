import { TS_PATTERNS, TS_NAMES, TS_TYPES, TS_VALUES, TS_PARAMS, TS_RETURNS } from './token-pools/typescript';
import { PY_PATTERNS, PY_NAMES, PY_TYPES } from './token-pools/python';
import { GO_PATTERNS, GO_NAMES } from './token-pools/go';
import { RUST_PATTERNS, RUST_NAMES } from './token-pools/rust';
import { SQL_PATTERNS, SQL_NAMES } from './token-pools/sql';
import { BASH_PATTERNS, BASH_NAMES } from './token-pools/bash';

export type LanguageId = 'typescript' | 'python' | 'go' | 'rust' | 'sql' | 'bash';
export type TyperMode = 'standard' | 'symbols' | 'regex';

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const SYMBOL_SNIPPETS = [
  'const filter = (arr: T[]) => arr.filter(x => x?.id && x.val >= 0);',
  'type Handler<T, K extends keyof T> = (obj: T, key: K) => T[K] | null;',
  'const [a, b, ...rest] = items.map((x, idx) => ({ [idx]: x?.val ?? 0 }));',
  'const fn = async <T,>({ a, b }: Props<T>): Promise<Result<T>> => {};',
  'match &val { Ok(Some(x)) => x.process(10)??, Err(e) => panic!("{:?}", e) };',
  'select { case msg := <-ch: val := &msg.Data; default: return nil }',
  'results = [{**x, "active": True} for x in items if x.get("ok", False)]',
];

const REGEX_SNIPPETS = [
  '^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\\.[a-zA-Z0-9-.]+$',
  '^(https?:\\/\\/)?([\\da-z.-]+)\\.([a-z.]{2,6})([\\/\\w .-]*)*/?$',
  '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$',
  '\\b(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\b',
  '\\b(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})T(?<hour>\\d{2}):(?<min>\\d{2})\\b',
  '\\/\\*([^*]|[\\r\\n]|(\\*+([^*\\/]|[\\r\\n])))*\\*+\\/',
];

export function generateSnippet(lang: LanguageId, mode: TyperMode = 'standard'): string {
  if (mode === 'symbols') {
    return pickRandom(SYMBOL_SNIPPETS);
  }

  if (mode === 'regex') {
    return pickRandom(REGEX_SNIPPETS);
  }

  const lines: string[] = [];
  const lineCount = 3;

  switch (lang) {
    case 'typescript': {
      for (let i = 0; i < lineCount; i++) {
        const fn = pickRandom(TS_PATTERNS);
        lines.push(
          fn(
            pickRandom(TS_NAMES),
            pickRandom(TS_TYPES),
            pickRandom(TS_VALUES)
          )
        );
      }
      break;
    }
    case 'python': {
      for (let i = 0; i < lineCount; i++) {
        const fn = pickRandom(PY_PATTERNS);
        lines.push(fn(pickRandom(PY_NAMES), pickRandom(PY_TYPES)));
      }
      break;
    }
    case 'go': {
      for (let i = 0; i < lineCount; i++) {
        const fn = pickRandom(GO_PATTERNS);
        lines.push(fn(pickRandom(GO_NAMES)));
      }
      break;
    }
    case 'rust': {
      for (let i = 0; i < lineCount; i++) {
        const fn = pickRandom(RUST_PATTERNS);
        lines.push(fn(pickRandom(RUST_NAMES)));
      }
      break;
    }
    case 'sql': {
      for (let i = 0; i < lineCount; i++) {
        const fn = pickRandom(SQL_PATTERNS);
        lines.push(fn(pickRandom(SQL_NAMES)));
      }
      break;
    }
    case 'bash': {
      for (let i = 0; i < lineCount; i++) {
        const fn = pickRandom(BASH_PATTERNS);
        lines.push(fn(pickRandom(BASH_NAMES)));
      }
      break;
    }
  }

  return lines.join('\n');
}
