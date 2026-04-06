/// <reference types="react" />
import { WebView } from 'react-native-webview';
export interface UseYouTubeWebViewOptions {
    videoId: string;
    onStateChange?: (state: string) => void;
    onTimeUpdate?: (currentTime: number) => void;
    onFrameCapture?: (dataUrl: string | null) => void;
    onReady?: () => void;
}
export interface UseYouTubeWebViewReturn {
    webViewRef: React.RefObject<WebView>;
    webViewProps: {
        source: {
            html: string;
        };
        onMessage: (event: any) => void;
        style: any;
        javaScriptEnabled: boolean;
        domStorageEnabled: boolean;
        allowsInlineMediaPlayback: boolean;
        mediaPlaybackRequiresUserAction: boolean;
    };
    playerState: string;
    currentTime: number;
    isReady: boolean;
    controls: {
        play: () => void;
        pause: () => void;
        seekTo: (seconds: number) => void;
        setPlaybackRate: (rate: number) => void;
        captureFrame: () => void;
    };
}
export declare function useYouTubeWebView(options: UseYouTubeWebViewOptions): UseYouTubeWebViewReturn;
//# sourceMappingURL=useYouTubeWebView.d.ts.map