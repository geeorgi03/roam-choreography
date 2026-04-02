import React from 'react';
import type { ClipAnnotation, AnnotationType } from '@roam/types';
export type VideoContentRect = {
    x: number;
    y: number;
    width: number;
    height: number;
};
export interface AnnotationOverlayProps {
    annotations: ClipAnnotation[];
    containerWidth: number;
    containerHeight: number;
    videoRect: VideoContentRect;
    activeTool: AnnotationType;
    onPlaceText: (x: number, y: number, text: string) => void;
    onPlaceArrow: (x1: number, y1: number, x2: number, y2: number) => void;
    onPlaceCircle: (cx: number, cy: number, r: number) => void;
}
export declare function AnnotationOverlay({ annotations, containerWidth, containerHeight, videoRect, activeTool, onPlaceText, onPlaceArrow, onPlaceCircle, }: AnnotationOverlayProps): React.JSX.Element;
//# sourceMappingURL=AnnotationOverlay.d.ts.map