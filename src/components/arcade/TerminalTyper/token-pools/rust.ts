export const RUST_PATTERNS = [
  (n: string) => `pub async fn handle_${n}(&self, req: Request<Body>) -> Result<Response<Body>, StatusCode> {`,
  (n: string) => `let mut stream = self.pool.acquire().await.map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;`,
  (n: string) => `match self.cache.get(&${n}).await { Some(hit) => Ok(hit), None => self.fallback().await }`,
  (n: string) => `#[derive(Debug, Clone, Serialize, Deserialize)]`,
  (n: string) => `let items: Vec<_> = data.into_iter().filter(|x| x.is_valid()).collect();`,
  (n: string) => `tokio::spawn(async move { if let Err(e) = worker.run().await { error!("{:?}", e); } });`,
  (n: string) => `let arc_state = Arc::new(RwLock::new(${n}));`,
  (n: string) => `impl<T> Handler for Service<T> where T: Send + Sync + 'static {`,
];

export const RUST_NAMES = ['session', 'buffer', 'channel', 'peer', 'record', 'manifest', 'payload'];
