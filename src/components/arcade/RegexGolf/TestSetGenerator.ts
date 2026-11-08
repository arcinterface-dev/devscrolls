import { ARCHETYPES, type Archetype } from './archetypes';

export interface ChallengeData {
  archetype: Archetype;
  matches: string[]; // Strings that MUST match (Green)
  rejects: string[]; // Strings that must NOT match (Red)
  parLength: number;
}

export function generateChallenge(difficulty?: 'easy' | 'medium' | 'hard'): ChallengeData {
  const eligible = difficulty
    ? ARCHETYPES.filter((a) => a.difficulty === difficulty)
    : ARCHETYPES;

  const archetype = eligible[Math.floor(Math.random() * eligible.length)] || ARCHETYPES[0];

  const matchSet = new Set<string>();
  while (matchSet.size < 6) {
    matchSet.add(archetype.generateMatch());
  }

  const rejectSet = new Set<string>();
  while (rejectSet.size < 6) {
    rejectSet.add(archetype.generateReject());
  }

  return {
    archetype,
    matches: Array.from(matchSet),
    rejects: Array.from(rejectSet),
    parLength: archetype.parLength,
  };
}
