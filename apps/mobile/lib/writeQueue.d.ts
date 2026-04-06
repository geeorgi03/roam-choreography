export type QueuedWrite = {
    id: string;
    endpoint: string;
    method: string;
    body: string;
    timestamp: number;
};
type EnqueueWriteInput = {
    endpoint: string;
    method: string;
    body: string;
};
export declare function isNetworkError(error: unknown): error is TypeError;
export declare function enqueueWrite(write: EnqueueWriteInput): void;
export declare function getQueueLength(): number;
export declare function drainQueue(accessToken: string): Promise<void>;
export {};
//# sourceMappingURL=writeQueue.d.ts.map