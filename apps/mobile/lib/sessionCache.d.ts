import type { Session } from '@roam/types';
export type CachedSession = {
    session: {
        name: string;
        phrase: string | null;
        quality_target: {
            clip_url: string;
            timestamp_ms: number;
            source_clip_id: string;
        } | null;
    };
    sections: unknown[];
    clips: unknown[];
    cachedAt: number;
};
export type CachedSessionListItem = Pick<Session, 'id' | 'name' | 'created_at'>;
export declare function getCachedSessionIndex(): string[];
export declare function cacheSession(sessionId: string, payload: {
    session: CachedSession['session'];
    sections: CachedSession['sections'];
    clips: CachedSession['clips'];
    cachedAt: number;
}): void;
export declare function cacheSessionList(sessions: CachedSessionListItem[]): void;
export declare function getCachedSessionList(): CachedSessionListItem[];
export declare function getCachedSession(sessionId: string): CachedSession | null;
//# sourceMappingURL=sessionCache.d.ts.map