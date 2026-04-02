import type { MMKV } from 'react-native-mmkv';
import type { QueueItem } from '../services/uploadQueue';
declare let storage: MMKV | null;
export { storage };
export declare function getUploadQueue(): QueueItem[];
export declare function setUploadQueue(queue: QueueItem[]): void;
export declare function getTusUrls(): Record<string, string>;
export declare function setTusUrls(urls: Record<string, string>): void;
//# sourceMappingURL=storage.d.ts.map