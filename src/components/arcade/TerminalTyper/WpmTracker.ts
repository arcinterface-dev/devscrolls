export class WpmTracker {
  private startTime: number = 0;
  private totalTyped: number = 0;
  private correctCharacters: number = 0;
  private errorMap: Record<string, number> = {};

  start(): void {
    this.startTime = performance.now();
    this.totalTyped = 0;
    this.correctCharacters = 0;
    this.errorMap = {};
  }

  recordKey(expectedChar: string, typedChar: string): boolean {
    this.totalTyped += 1;
    const isCorrect = expectedChar === typedChar;

    if (isCorrect) {
      this.correctCharacters += 1;
    } else {
      const key = expectedChar === ' ' ? 'SPACE' : expectedChar === '\n' ? 'ENTER' : expectedChar;
      this.errorMap[key] = (this.errorMap[key] || 0) + 1;
    }

    return isCorrect;
  }

  getMetrics(): { wpm: number; accuracy: number; elapsedSeconds: number; errorMap: Record<string, number> } {
    if (this.startTime === 0) {
      return { wpm: 0, accuracy: 100, elapsedSeconds: 0, errorMap: {} };
    }

    const elapsedMs = performance.now() - this.startTime;
    const elapsedMinutes = Math.max(0.01, elapsedMs / 60000);
    const elapsedSeconds = Math.round(elapsedMs / 1000);

    // Standard typing test formula: 5 characters = 1 word
    const wpm = Math.max(0, Math.round((this.correctCharacters / 5) / elapsedMinutes));
    const accuracy = this.totalTyped > 0 
      ? Math.max(0, Math.min(100, Number(((this.correctCharacters / this.totalTyped) * 100).toFixed(1))))
      : 100;

    return {
      wpm,
      accuracy,
      elapsedSeconds,
      errorMap: { ...this.errorMap },
    };
  }
}
