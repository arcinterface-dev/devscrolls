export interface AlertPrompt {
  id: string;
  text: string;
  keyLabel: string;
  expectedKey: string;
  icon: string;
}

export const ALERTS: AlertPrompt[] = [
  { id: 'abort', text: 'ABORT DEPLOY!', keyLabel: 'SPACE', expectedKey: ' ', icon: '🚨' },
  { id: 'kill', text: 'KILL PROCESS!', keyLabel: 'K', expectedKey: 'k', icon: '🔥' },
  { id: 'rollback', text: 'ROLLBACK NOW!', keyLabel: 'R', expectedKey: 'r', icon: '💾' },
  { id: 'scale', text: 'SCALE UP!', keyLabel: 'S', expectedKey: 's', icon: '⚡' },
  { id: 'firewall', text: 'FIREWALL BLOCK!', keyLabel: 'F', expectedKey: 'f', icon: '🛑' },
  { id: 'restart', text: 'RESTART SERVICE!', keyLabel: 'ENTER', expectedKey: 'Enter', icon: '🔄' },
  { id: 'flush', text: 'FLUSH CACHE!', keyLabel: 'C', expectedKey: 'c', icon: '🧹' },
  { id: 'patch', text: 'PATCH SECURITY!', keyLabel: 'P', expectedKey: 'p', icon: '🔒' },
  { id: 'merge', text: 'MERGE HOTFIX!', keyLabel: 'M', expectedKey: 'm', icon: '🔀' },
  { id: 'backup', text: 'BACKUP DATABASE!', keyLabel: 'B', expectedKey: 'b', icon: '💿' },
  { id: 'secrets', text: 'ROTATE SECRETS!', keyLabel: 'X', expectedKey: 'x', icon: '🔑' },
  { id: 'drain', text: 'DRAIN NODE!', keyLabel: 'D', expectedKey: 'd', icon: '🚰' },
  { id: 'ack', text: 'ACKNOWLEDGE ALERT!', keyLabel: 'A', expectedKey: 'a', icon: '📟' },
  { id: 'isolate', text: 'ISOLATE NETWORK!', keyLabel: 'I', expectedKey: 'i', icon: '🌐' },
  { id: 'failover', text: 'TRIGGER FAILOVER!', keyLabel: 'T', expectedKey: 't', icon: '🔃' },
  { id: 'revoke', text: 'REVOKE TOKEN!', keyLabel: 'V', expectedKey: 'v', icon: '🚫' },
];
