import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'home-state' });

/** Preferred key — last session the user opened (tool-style “current project”). */
const LAST_OPENED_KEY = 'last_opened_session_id';

/**
 * Legacy key — older builds wrote the newest session id here on every fetch.
 * Still read for migration; new code should use {@link setLastOpenedSessionId}.
 */
const LEGACY_LAST_KEY = 'last_session_id';
const HOME_PLUS_COACH_DISMISSED = 'home_plus_coach_dismissed';

export function getLastOpenedSessionId(): string | undefined {
  const next = storage.getString(LAST_OPENED_KEY);
  if (next) return next;
  const legacy = storage.getString(LEGACY_LAST_KEY);
  return legacy ?? undefined;
}

export function setLastOpenedSessionId(sessionId: string): void {
  storage.set(LAST_OPENED_KEY, sessionId);
  storage.delete(LEGACY_LAST_KEY);
}

export function clearLastOpenedSessionId(): void {
  storage.delete(LAST_OPENED_KEY);
  storage.delete(LEGACY_LAST_KEY);
}

/** One-time “Tap +” coach on the sessions hub; persists after dismiss or first session. */
export function isHomePlusCoachDismissed(): boolean {
  return storage.getBoolean(HOME_PLUS_COACH_DISMISSED) === true;
}

export function dismissHomePlusCoach(): void {
  storage.set(HOME_PLUS_COACH_DISMISSED, true);
}
