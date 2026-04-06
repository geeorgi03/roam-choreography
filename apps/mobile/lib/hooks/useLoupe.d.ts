/// <reference types="react" />
export declare const LOUPE_DIAMETER = 140;
export interface LoupeState {
    x: number;
    y: number;
    zoom: number;
}
export interface UseLoupeOptions {
    persistKey?: string | null;
    frameSize: {
        width: number;
        height: number;
    };
    onFrameCapture?: () => Promise<string | null>;
}
export interface UseLoupeReturn {
    loupeActive: boolean;
    loupeZoom: number;
    capturedFrame: string | null;
    loupeX: any;
    loupeY: any;
    loupeActiveShared: any;
    loupeZoomShared: any;
    loupeLastX: React.MutableRefObject<number>;
    loupeLastY: React.MutableRefObject<number>;
    loupeLastZoom: React.MutableRefObject<number>;
    loupeAnimatedStyle: any;
    loupeVideoAnimatedStyle: any;
    loupeOverlayAnimatedStyle: any;
    activateLoupe: (zoom: number, x: number, y: number) => void;
    updateLoupeZoom: (zoom: number) => void;
    saveLoupeState: (x: number, y: number) => void;
    resetLoupe: () => void;
    captureCurrentFrame: () => Promise<void>;
    setCapturedFrame: (frame: string | null) => void;
}
export declare function useLoupe(options: UseLoupeOptions): UseLoupeReturn;
//# sourceMappingURL=useLoupe.d.ts.map