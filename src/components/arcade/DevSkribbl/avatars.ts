export interface DevAvatar {
  id: string;
  name: string;
  emoji: string;
  role: string;
}

export const DEV_AVATARS: DevAvatar[] = [
  { id: '10x', name: '10x Dev', emoji: '🕶️', role: 'Deploys directly to production' },
  { id: 'intern', name: 'Junior Intern', emoji: '🐣', role: 'git push --force survivor' },
  { id: 'sre', name: 'On-Call SRE', emoji: '🚨', role: 'Pager duty at 3 AM' },
  { id: 'scrum', name: 'Scrum Master', emoji: '📋', role: 'Can this be a 3-pointer?' },
  { id: 'tux', name: 'Linux Purist', emoji: '🐧', role: 'Arch btw & Vim keybindings' },
  { id: 'ai', name: 'AI Assistant', emoji: '🤖', role: 'Trained on Stack Overflow' },
  { id: 'coffee', name: 'Caffeine Addict', emoji: '☕', role: 'Converts coffee into code' },
  { id: 'qa', name: 'Bug Hunter', emoji: '🐛', role: 'Orders 0 beers in a bar' },
];
