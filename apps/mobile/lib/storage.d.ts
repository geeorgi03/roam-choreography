import type { MMKV } from 'react-native-mmkv';
import type { QueueItem } from '../services/uploadQueue';
declare let storage: MMKV | null;
export { storage };
type LoupeState = {
    x: number;
    y: number;
    zoom: number;
};
export declare function getUploadQueue(): QueueItem[];
export declare function setUploadQueue(queue: QueueItem[]): void;
export declare function getTusUrls(): Record<string, string>;
export declare function setTusUrls(urls: Record<string, string>): void;
export declare function getLoupeState(key: string): LoupeState | null;
export declare function setLoupeState(key: string, state: LoupeState): void;
export declare function getSessionMode(sessionId: string): boolean;
export declare function setSessionMode(sessionId: string, value: boolean): void;
//# sourceMappingURL=storage.d.ts.map