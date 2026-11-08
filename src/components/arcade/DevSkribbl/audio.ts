// Sounds completely removed as requested
class SoundFX {
  public toggleMute(): boolean { return true; }
  public getMuted(): boolean { return true; }
  public playPop() {}
  public playTick() {}
  public playCorrectChime() {}
  public playCloseWarning() {}
  public playFanfare() {}
}

export const sound = new SoundFX();
