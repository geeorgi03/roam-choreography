/**
 * Upload a clip file to Mux using the TUS Direct Upload URL.
 * @param uploadUrl - The Mux Direct Upload TUS URL from POST /clips/upload-url
 * @param fileUri - Expo/React Native file URI (e.g. file:///...)
 * @param onProgress - Optional callback with progress percentage 0-100
 */
export declare class UploadAbortedError extends Error {
    constructor(message?: string);
}
export declare function uploadClipToMux(uploadUrl: string, fileUri: string, onProgress?: (pct: number) => void): {
    promise: Promise<void>;
    abort: () => void;
};
//# sourceMappingURL=upload.d.ts.map