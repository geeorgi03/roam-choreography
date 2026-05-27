import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'spatial-coach' });
const DISMISSED_KEY = 'spatial_pen_coach_dismissed';

export function isSpatialCoachDismissed(): boolean {
  return storage.getBoolean(DISMISSED_KEY) === true;
}

export function dismissSpatialCoach(): void {
  storage.set(DISMISSED_KEY, true);
}
