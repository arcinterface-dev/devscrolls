import { JSONPath } from 'jsonpath-plus';

export interface FormatterResult {
  formatted: string;
  error: string | null;
  isValid: boolean;
  metadata?: {
    size: number;
    depth: number;
    keyCount: number;
  };
}

export function parseAndFormatJson(input: string, spaces: number = 2): FormatterResult {
  if (!input.trim()) {
    return { formatted: '', error: null, isValid: false };
  }

  try {
    const parsed = JSON.parse(input);
    const formatted = JSON.stringify(parsed, null, spaces);
    
    // Calculate simple metadata
    const metadata = {
      size: new TextEncoder().encode(input).length,
      depth: getDepth(parsed),
      keyCount: countKeys(parsed)
    };

    return {
      formatted,
      error: null,
      isValid: true,
      metadata
    };
  } catch (err: any) {
    // Try to auto-fix common errors
    try {
      const fixedInput = autoFixJson(input);
      const parsed = JSON.parse(fixedInput);
      const formatted = JSON.stringify(parsed, null, spaces);
      
      const metadata = {
        size: new TextEncoder().encode(fixedInput).length,
        depth: getDepth(parsed),
        keyCount: countKeys(parsed)
      };
      
      return {
        formatted,
        error: `Syntax error (Auto-fix available, click Beautify). Original error: ${err.message}`,
        isValid: true,
        metadata
      };
    } catch (fixErr) {
      return {
        formatted: '',
        error: err.message || "Invalid JSON",
        isValid: false
      };
    }
  }
}

function autoFixJson(input: string): string {
  let fixed = input;
  // Replace single quotes with double quotes (rough heuristic, avoids quotes inside words)
  fixed = fixed.replace(/'([^']+)'/g, '"$1"');
  // Fix unquoted keys
  fixed = fixed.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
  // Remove trailing commas
  fixed = fixed.replace(/,\s*([}\]])/g, '$1');
  return fixed;
}

function getDepth(obj: any): number {
  if (obj === null || typeof obj !== 'object') return 0;
  let maxDepth = 0;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      maxDepth = Math.max(maxDepth, getDepth(obj[key]));
    }
  }
  return 1 + maxDepth;
}

function countKeys(obj: any): number {
  if (obj === null || typeof obj !== 'object') return 0;
  let count = 0;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      count += 1 + countKeys(obj[key]);
    }
  }
  return count;
}

export function queryJsonPath(jsonStr: string, path: string): FormatterResult {
  if (!jsonStr.trim() || !path.trim()) {
    return { formatted: jsonStr, error: null, isValid: false };
  }

  try {
    const parsed = JSON.parse(jsonStr);
    const result = JSONPath({ path: path, json: parsed });
    const formatted = JSON.stringify(result, null, 2);
    
    return {
      formatted,
      error: null,
      isValid: true,
      metadata: {
        size: new TextEncoder().encode(formatted).length,
        depth: getDepth(result),
        keyCount: countKeys(result)
      }
    };
  } catch (err: any) {
    return {
      formatted: '',
      error: `Invalid JSONPath query or JSON payload: ${err.message}`,
      isValid: false
    };
  }
}

export function getSampleJson(type: 'simple' | 'nested' | 'large'): string {
  if (type === 'simple') {
    return JSON.stringify({
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      isActive: true,
      roles: ["admin", "user"]
    }, null, 2);
  }
  
  if (type === 'nested') {
    return JSON.stringify({
      company: "TechCorp",
      employees: [
        {
          id: 101,
          name: "Alice Smith",
          department: {
            name: "Engineering",
            location: "Building A",
            projects: [
              { name: "Project Alpha", status: "Active" },
              { name: "Project Beta", status: "Planning" }
            ]
          }
        },
        {
          id: 102,
          name: "Bob Jones",
          department: {
            name: "Design",
            location: "Building B",
            projects: []
          }
        }
      ]
    }, null, 2);
  }
  
  // Large array of objects typical in API responses
  const largeArray = Array.from({ length: 50 }).map((_, i) => ({
    id: 1000 + i,
    uuid: `uuid-${Math.random().toString(36).substring(2, 10)}`,
    profile: {
      firstName: `User${i}`,
      lastName: "Test",
      age: 20 + (i % 30)
    },
    status: i % 2 === 0 ? "active" : "inactive",
    lastLogin: new Date(Date.now() - i * 86400000).toISOString(),
    tags: ["system", i % 3 === 0 ? "premium" : "basic"]
  }));
  
  return JSON.stringify({
    metadata: {
      total: 50,
      page: 1,
      limit: 50
    },
    data: largeArray
  }, null, 2);
}

export function sortJsonKeys(jsonStr: string): FormatterResult {
  if (!jsonStr.trim()) {
    return { formatted: '', error: null, isValid: false };
  }
  try {
    const parsed = JSON.parse(jsonStr);
    const sorted = sortObjectKeys(parsed);
    const formatted = JSON.stringify(sorted, null, 2);
    
    return {
      formatted,
      error: null,
      isValid: true,
      metadata: {
        size: new TextEncoder().encode(formatted).length,
        depth: getDepth(sorted),
        keyCount: countKeys(sorted)
      }
    };
  } catch (err: any) {
    return {
      formatted: '',
      error: `Could not sort keys. Invalid JSON: ${err.message}`,
      isValid: false
    };
  }
}

function sortObjectKeys(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  
  const sortedKeys = Object.keys(obj).sort();
  const sortedObj: any = {};
  for (const key of sortedKeys) {
    sortedObj[key] = sortObjectKeys(obj[key]);
  }
  return sortedObj;
}

