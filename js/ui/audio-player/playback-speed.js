export const PLAYBACK_SPEED_STEPS = Object.freeze([
  0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4
]);

export const PLAYBACK_SPEED_MIN = 0.25;
export const PLAYBACK_SPEED_MAX = 4;
export const PLAYBACK_SPEED_STEP = 0.01;

export function isValidPlaybackSpeed(speed) {
  return typeof speed === 'number' && Number.isFinite(speed) &&
    speed >= PLAYBACK_SPEED_MIN && speed <= PLAYBACK_SPEED_MAX &&
    Math.abs(speed - Math.round(speed * 100) / 100) < 1e-9;
}

export function normalizePlaybackSpeed(value) {
  const speed = Number(value);
  if (!Number.isFinite(speed) || speed < PLAYBACK_SPEED_MIN || speed > PLAYBACK_SPEED_MAX) return null;
  return Math.round(speed * 100) / 100;
}
