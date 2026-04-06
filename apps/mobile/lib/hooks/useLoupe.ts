import { useEffect, useRef, useState } from 'react';
import { useSharedValue, runOnJS } from 'react-native-reanimated';
import { MMKV } from 'react-native-mmkv';

// Loupe persistence — key: loupe:${mux_playback_id ?? clip_id ?? source_url} -> { x, y, zoom }
const loupeStorage = new MMKV({ id: 'loupe-state' });

// Loupe constants
export const LOUPE_DIAMETER = 140;

export interface LoupeState {
  x: number;
  y: number;
  zoom: number;
}

export interface UseLoupeOptions {
  persistKey?: string | null;
  frameSize: { width: number; height: number };
  onFrameCapture?: () => Promise<string | null>; // For YouTube frame capture
}

export interface UseLoupeReturn {
  // State
  loupeActive: boolean;
  loupeZoom: number;
  capturedFrame: string | null;
  
  // Shared values for animations
  loupeX: any;
  loupeY: any;
  loupeActiveShared: any;
  loupeZoomShared: any;
  
  // Refs for tracking last values
  loupeLastX: React.MutableRefObject<number>;
  loupeLastY: React.MutableRefObject<number>;
  loupeLastZoom: React.MutableRefObject<number>;
  
  // Animated styles
  loupeAnimatedStyle: any;
  loupeVideoAnimatedStyle: any;
  loupeOverlayAnimatedStyle: any;
  
  // Actions
  activateLoupe: (zoom: number, x: number, y: number) => void;
  updateLoupeZoom: (zoom: number) => void;
  saveLoupeState: (x: number, y: number) => void;
  resetLoupe: () => void;
  captureCurrentFrame: () => Promise<void>;
  setCapturedFrame: (frame: string | null) => void;
}

export function useLoupe(options: UseLoupeOptions): UseLoupeReturn {
  const { persistKey, frameSize, onFrameCapture } = options;
  
  // State
  const [loupeActive, setLoupeActive] = useState(false);
  const [loupeZoom, setLoupeZoom] = useState(2.5);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  
  // Shared values for animations
  const loupeX = useSharedValue(0);
  const loupeY = useSharedValue(0);
  const loupeActiveShared = useSharedValue(0); // 0 = inactive, 1 = active
  const loupeZoomShared = useSharedValue(2.5);
  
  // Refs for tracking last values
  const loupeLastX = useRef(0);
  const loupeLastY = useRef(0);
  const loupeLastZoom = useRef(0);
  
  // Animated styles
  const loupeAnimatedStyle = useSharedValue(() => ({
    transform: [
      { translateX: loupeX.value - LOUPE_DIAMETER / 2 },
      { translateY: loupeY.value - LOUPE_DIAMETER / 2 },
    ],
  }));
  
  const loupeVideoAnimatedStyle = useSharedValue(() => ({
    transform: [
      { scale: loupeZoomShared.value },
      { translateX: -(loupeX.value - LOUPE_DIAMETER / 2) * (loupeZoomShared.value - 1) },
      { translateY: -(loupeY.value - LOUPE_DIAMETER / 2) * (loupeZoomShared.value - 1) },
    ],
  }));
  
  const loupeOverlayAnimatedStyle = useSharedValue(() => ({
    transform: [
      { scale: loupeZoomShared.value },
      { translateX: -(loupeX.value - LOUPE_DIAMETER / 2) * (loupeZoomShared.value - 1) },
      { translateY: -(loupeY.value - LOUPE_DIAMETER / 2) * (loupeZoomShared.value - 1) },
    ],
  }));
  
  // Initialize loupe position to center of video container only if no saved state exists
  useEffect(() => {
    if (frameSize.width > 0 && frameSize.height > 0) {
      // Only center-initialize if no saved state exists for the current persistKey
      if (!persistKey || !loupeStorage.getString(persistKey)) {
        loupeX.value = frameSize.width / 2;
        loupeY.value = frameSize.height / 2;
        loupeLastX.current = frameSize.width / 2;
        loupeLastY.current = frameSize.height / 2;
      }
    }
  }, [frameSize, persistKey]);
  
  // Restore saved loupe state on clip open - single restore effect
  useEffect(() => {
    if (!persistKey) return;
    
    try {
      const savedStateString = loupeStorage.getString(persistKey);
      if (savedStateString) {
        const savedState = JSON.parse(savedStateString);
        
        // Validate shape and numeric finiteness before applying values
        if (
          savedState &&
          typeof savedState.x === 'number' &&
          typeof savedState.y === 'number' &&
          typeof savedState.zoom === 'number' &&
          Number.isFinite(savedState.x) &&
          Number.isFinite(savedState.y) &&
          Number.isFinite(savedState.zoom) &&
          savedState.zoom >= 2 &&
          savedState.zoom <= 3
        ) {
          loupeLastX.current = savedState.x;
          loupeLastY.current = savedState.y;
          loupeLastZoom.current = savedState.zoom;
          loupeX.value = savedState.x;
          loupeY.value = savedState.y;
          loupeZoomShared.value = savedState.zoom;
        } else {
          // Malformed data - clear the key so restore falls back to default centering
          loupeStorage.delete(persistKey);
        }
      }
    } catch {
      // Silently ignore malformed data
    }
  }, [persistKey]);
  
  // JS-thread helpers for gesture callbacks
  const activateLoupe = runOnJS((zoom: number, x: number, y: number) => {
    setLoupeZoom(zoom);
    loupeZoomShared.value = zoom;
    setLoupeActive(true);
    loupeLastZoom.current = zoom;
    loupeLastX.current = x;
    loupeLastY.current = y;
    // Attempt frame capture when loupe activates (for YouTube)
    if (onFrameCapture) {
      onFrameCapture().then(setCapturedFrame).catch(() => {});
    }
  });
  
  const updateLoupeZoom = runOnJS((zoom: number) => {
    setLoupeZoom(zoom);
    loupeZoomShared.value = zoom;
    loupeLastZoom.current = zoom;
  });
  
  const saveLoupeState = runOnJS((x: number, y: number) => {
    if (persistKey) {
      loupeStorage.set(persistKey, JSON.stringify({ x, y, zoom: loupeLastZoom.current }));
    }
  });
  
  const resetLoupe = runOnJS(() => {
    setLoupeActive(false);
    loupeActiveShared.value = 0;
    loupeLastZoom.current = 0;
    loupeLastX.current = 0;
    loupeLastY.current = 0;
    setCapturedFrame(null);
  });
  
  const captureCurrentFrame = async () => {
    if (onFrameCapture) {
      try {
        const frame = await onFrameCapture();
        setCapturedFrame(frame);
      } catch (error) {
        console.warn('Frame capture failed:', error);
        setCapturedFrame(null);
      }
    }
  };
  
  return {
    // State
    loupeActive,
    loupeZoom,
    capturedFrame,
    
    // Shared values
    loupeX,
    loupeY,
    loupeActiveShared,
    loupeZoomShared,
    
    // Refs
    loupeLastX,
    loupeLastY,
    loupeLastZoom,
    
    // Animated styles
    loupeAnimatedStyle,
    loupeVideoAnimatedStyle,
    loupeOverlayAnimatedStyle,
    
    // Actions
    activateLoupe,
    updateLoupeZoom,
    saveLoupeState,
    resetLoupe,
    captureCurrentFrame,
    setCapturedFrame,
  };
}
