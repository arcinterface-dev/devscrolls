export const PY_PATTERNS = [
  (n: string, t: string) => `def get_${n}(id: int, timeout: float = 5.0) -> ${capitalize(t)}:`,
  (n: string) => `async with aiohttp.ClientSession() as session:`,
  (a: string, b: string) => `results = [x.${a} for x in ${b} if x.is_active()]`,
  (n: string) => `@dataclass(frozen=True, slots=True)`,
  (n: string) => `class ${capitalize(n)}Repository(BaseService):`,
  (a: string, b: string) => `logger.info(f"Processing {${a}} for tenant_{${b}}")`,
  (n: string) => `data = json.loads(await request.text())`,
  (n: string) => `if not ${n}: raise HTTPException(status_code=404, detail="Not Found")`,
  (a: string, b: string) => `return {k: v for k, v in ${a}.items() if v is not None}`,
  (n: string) => `await redis.setex(f"cache:{${n}}", 3600, json.dumps(payload))`,
];

export const PY_NAMES = ['user_id', 'cluster', 'pipeline', 'metric', 'job_queue', 'token', 'worker_pool'];
export const PY_TYPES = ['Dict[str, Any]', 'List[User]', 'Optional[Record]', 'ResponseModel', 'bool'];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
