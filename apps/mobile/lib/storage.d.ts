import type { MMKV } from 'react-native-mmkv';
import type { QueueItem } from '../services/uploadQueue';
declare let storage: MMKV | null;
export { storage };
type LoupeState = {
    x: number;
    y: number;
    zoom: number;
};
type LoopState = {
    start: number;
    end: number;
};
export declare function getUploadQueue(): QueueItem[];
export declare function setUploadQueue(queue: QueueItem[]): void;
export declare function getTusUrls(): Record<string, string>;
export declare function setTusUrls(urls: Record<string, string>): void;
export declare function getLoupeState(key: string): LoupeState | null;
export declare function setLoupeState(key: string, state: LoupeState): void;
export declare function getSessionMode(sessionId: string): boolean;
export declare function setSessionMode(sessionId: string, value: boolean): void;
export declare function getLoopState(sessionId: string): LoopState | null;
export declare function setLoopState(sessionId: string, state: LoopState | null): void;
export declare function getLoopOpenAt(sessionId: string): number | null;
export declare function setLoopOpenAt(sessionId: string, value: number | null): void;
export declare function setActiveSessionId(sessionId: string): void;
export declare function getActiveSessionId(): string | null;
export declare function setActiveSection(sessionId: string, section: string): void;
export declare function getActiveSection(sessionId: string): string | null;
export declare function setActiveSectionId(sectionId: string): void;
export declare function getActiveSectionId(): string | null;
//# sourceMappingURL=storage.d.ts.map