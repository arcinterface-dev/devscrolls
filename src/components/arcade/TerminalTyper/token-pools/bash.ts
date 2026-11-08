export const BASH_PATTERNS = [
  (n: string) => `docker build -t app:${n} --build-arg ENV=production -f Dockerfile .`,
  (n: string) => `kubectl rollout restart deployment/${n} -n production && kubectl rollout status deployment/${n}`,
  (n: string) => `tar -czvf backup_$(date +%Y%m%d).tar.gz /var/log/${n}/ && aws s3 cp . s3://bucket/`,
  (n: string) => `curl -s -o /dev/null -w "%{http_code}" https://api.service.internal/healthcheck | grep 200`,
  (n: string) => `find ./src -type f -name "*.${n}" -exec sed -i 's/old_var/new_var/g' {} +`,
  (n: string) => `git log --graph --oneline --decorate --all -n 20 | awk '{print $1, $2}'`,
];

export const BASH_NAMES = ['service', 'worker', 'gateway', 'indexer', 'redis', 'router'];
