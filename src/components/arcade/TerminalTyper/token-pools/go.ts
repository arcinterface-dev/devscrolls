export const GO_PATTERNS = [
  (n: string) => `func (s *Service) Handle${capitalize(n)}(ctx context.Context, req *Request) (*Response, error) {`,
  (n: string) => `val, err := s.client.Get(ctx, key).Result()`,
  (n: string) => `if err != nil { return nil, fmt.Errorf("failed to query ${n}: %w", err) }`,
  (n: string) => `go func(id string) { defer wg.Done(); s.process(id) }(${n})`,
  (n: string) => `ch := make(chan *${capitalize(n)}, bufferSize)`,
  (a: string, b: string) => `type ${capitalize(a)} struct { ID string \`json:"id"\`; ${capitalize(b)} int \`json:"count"\` }`,
  (n: string) => `select { case msg := <-ch: return msg, nil; case <-ctx.Done(): return nil, ctx.Err() }`,
  (n: string) => `mu.Lock(); defer mu.Unlock()`,
  (n: string) => `metrics.Incr("requests.total", []string{"status:200"}, 1.0)`,
];

export const GO_NAMES = ['session', 'worker', 'cluster', 'node', 'event', 'record', 'batch'];

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
