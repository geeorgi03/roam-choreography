"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadClipToMux = exports.UploadAbortedError = void 0;
const tus = __importStar(require("tus-js-client"));
/**
 * Upload a clip file to Mux using the TUS Direct Upload URL.
 * @param uploadUrl - The Mux Direct Upload TUS URL from POST /clips/upload-url
 * @param fileUri - Expo/React Native file URI (e.g. file:///...)
 * @param onProgress - Optional callback with progress percentage 0-100
 */
class UploadAbortedError extends Error {
    constructor(message = 'Upload aborted') {
        super(message);
        this.name = 'UploadAbortedError';
    }
}
exports.UploadAbortedError = UploadAbortedError;
function uploadClipToMux(uploadUrl, fileUri, onProgress) {
    let upload = null;
    let aborted = false;
    const promise = (async () => {
        const response = await fetch(fileUri);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            upload = new tus.Upload(blob, {
                uploadUrl,
                chunkSize: 5 * 1024 * 1024,
                retryDelays: [],
                metadata: {
                    filetype: 'video/mp4',
                },
                onProgress(bytesUploaded, bytesTotal) {
                    if (bytesTotal > 0) {
                        onProgress?.(Math.round((bytesUploaded / bytesTotal) * 100));
                    }
                },
                onError(error) {
                    if (aborted) {
                        reject(new UploadAbortedError());
                        return;
                    }
                    reject(error);
                },
                onSuccess() {
                    resolve();
                },
            });
            if (aborted) {
                upload.abort();
                reject(new UploadAbortedError('Upload aborted before start'));
                return;
            }
            upload.start();
        });
    })();
    return {
        promise,
        abort: () => {
            aborted = true;
            upload?.abort();
        },
    };
}
exports.uploadClipToMux = uploadClipToMux;
//# sourceMappingURL=upload.js.map