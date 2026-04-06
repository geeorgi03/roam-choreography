"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useYouTubeWebView = void 0;
const react_1 = require("react");
// Custom WebView HTML for YouTube with frame capture capability
const YOUTUBE_WEBVIEW_HTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background: #000; }
    #player { width: 100%; height: 100%; }
    #canvas { display: none; }
  </style>
</head>
<body>
  <div id="player"></div>
  <canvas id="canvas"></canvas>
  <script>
    let player;
    let canvas = document.getElementById('canvas');
    let ctx = canvas.getContext('2d');
    
    function onYouTubeIframeAPIReady() {
      player = new YT.Player('player', {
        videoId: 'VIDEO_ID_PLACEHOLDER',
        playerVars: {
          autoplay: 1,
          controls: 0,
          rel: 0,
          showinfo: 0,
          modestbranding: 1,
          iv_load_policy: 3,
          fs: 0
        },
        events: {
          onReady: function(event) {
            window.ReactNativeWebView.postMessage(JSON.stringify({type: 'ready'}));
          },
          onStateChange: function(event) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'stateChange',
              state: event.data
            }));
          }
        }
      });
    }
    
    window.captureFrame = function() {
      if (!player) return null;
      
      try {
        const videoElement = player.getIframe().querySelector('video');
        if (!videoElement) return null;
        
        canvas.width = videoElement.videoWidth || 640;
        canvas.height = videoElement.videoHeight || 360;
        
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // For now, return full frame - loupe cropping will be done in React Native
        return canvas.toDataURL('image/jpeg', 0.8);
      } catch (e) {
        console.error('Frame capture error:', e);
        return null;
      }
    };
    
    // Load YouTube API
    var tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  </script>
</body>
</html>
`;
function useYouTubeWebView(options) {
    const { videoId, onStateChange, onTimeUpdate, onFrameCapture, onReady } = options;
    const webViewRef = (0, react_1.useRef)(null);
    const [playerState, setPlayerState] = (0, react_1.useState)('unstarted');
    const [currentTime, setCurrentTime] = (0, react_1.useState)(0);
    const [isReady, setIsReady] = (0, react_1.useState)(false);
    const pollIntervalRef = (0, react_1.useRef)(null);
    const handleMessage = (0, react_1.useCallback)((event) => {
        try {
            const message = JSON.parse(event.nativeEvent.data);
            switch (message.type) {
                case 'ready':
                    setIsReady(true);
                    onReady?.();
                    break;
                case 'stateChange':
                    setPlayerState(message.state);
                    onStateChange?.(message.state);
                    // Poll current time when playing
                    if (message.state === 'playing') {
                        const pollCurrentTime = async () => {
                            if (webViewRef.current) {
                                webViewRef.current.injectJavaScript(`
                  if (window.player && window.player.getCurrentTime) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'timeUpdate',
                      currentTime: window.player.getCurrentTime()
                    }));
                  }
                `);
                            }
                        };
                        // Start polling
                        const interval = setInterval(pollCurrentTime, 500);
                        pollIntervalRef.current = interval;
                    }
                    else {
                        // Stop polling when not playing
                        if (pollIntervalRef.current) {
                            clearInterval(pollIntervalRef.current);
                            pollIntervalRef.current = null;
                        }
                    }
                    break;
                case 'timeUpdate':
                    setCurrentTime(message.currentTime);
                    onTimeUpdate?.(message.currentTime);
                    break;
                case 'frameCapture':
                    onFrameCapture?.(message.dataUrl || null);
                    break;
            }
        }
        catch (error) {
            console.warn('Failed to parse WebView message:', error);
        }
    }, [onStateChange, onTimeUpdate, onFrameCapture, onReady]);
    // Cleanup polling on unmount
    (0, react_1.useEffect)(() => {
        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
                pollIntervalRef.current = null;
            }
        };
    }, []);
    const controls = {
        play: (0, react_1.useCallback)(() => {
            if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
          if (window.player) {
            window.player.playVideo();
          }
        `);
            }
        }, []),
        pause: (0, react_1.useCallback)(() => {
            if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
          if (window.player) {
            window.player.pauseVideo();
          }
        `);
            }
        }, []),
        seekTo: (0, react_1.useCallback)((seconds) => {
            if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
          if (window.player) {
            window.player.seekTo(${seconds});
          }
        `);
            }
        }, []),
        setPlaybackRate: (0, react_1.useCallback)((rate) => {
            if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
          if (window.player) {
            window.player.setPlaybackRate(${rate});
          }
        `);
            }
        }, []),
        captureFrame: (0, react_1.useCallback)(() => {
            if (webViewRef.current) {
                webViewRef.current.injectJavaScript(`
          if (window.player && window.captureFrame) {
            const frameDataUrl = window.captureFrame();
            if (frameDataUrl) {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'frameCapture',
                dataUrl: frameDataUrl
              }));
            }
          }
        `);
            }
        }, [])
    };
    const webViewProps = {
        source: { html: YOUTUBE_WEBVIEW_HTML.replace(/VIDEO_ID_PLACEHOLDER/g, videoId) },
        onMessage: handleMessage,
        style: { flex: 1 },
        javaScriptEnabled: true,
        domStorageEnabled: true,
        allowsInlineMediaPlayback: true,
        mediaPlaybackRequiresUserAction: false,
    };
    return {
        webViewRef,
        webViewProps,
        playerState,
        currentTime,
        isReady,
        controls,
    };
}
exports.useYouTubeWebView = useYouTubeWebView;
//# sourceMappingURL=useYouTubeWebView.js.map