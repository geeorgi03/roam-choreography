"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useShareIntent = void 0;
const react_1 = require("react");
const react_native_1 = require("react-native");
const expo_router_1 = require("expo-router");
const useSession_1 = require("./useSession");
const storage_1 = require("../storage");
const api_1 = require("../api");
const react_native_toast_message_1 = __importDefault(require("react-native-toast-message"));
function useShareIntent() {
    const router = (0, expo_router_1.useRouter)();
    const { session } = (0, useSession_1.useSession)();
    const pendingShareRef = (0, react_1.useRef)(null);
    const exitTimerRef = (0, react_1.useRef)(null);
    const [pendingShareUrl, setPendingShareUrl] = (0, react_1.useState)(null);
    const [pendingShareMeta, setPendingShareMeta] = (0, react_1.useState)(null);
    const [initialSharedUrl, setInitialSharedUrl] = (0, react_1.useState)(null);
    const [initialUrlProcessed, setInitialUrlProcessed] = (0, react_1.useState)(false);
    const fetchOEmbedMetadata = async (url) => {
        if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
            return { title: url, thumbnail_url: null };
        }
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
            const response = await fetch(oembedUrl, {
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const data = await response.json();
            return {
                title: data.title || url,
                thumbnail_url: data.thumbnail_url || null,
            };
        }
        catch (error) {
            console.warn('Failed to fetch oEmbed metadata:', error);
            return { title: url, thumbnail_url: null };
        }
    };
    const createRefClip = async (sessionId, url, meta, activeSection) => {
        if (!session?.access_token) {
            throw new Error('No auth session');
        }
        const payload = {
            local_id: crypto.randomUUID(),
            recorded_at: new Date().toISOString(),
            label: 'REF',
            clip_type: 'REF',
            url,
            title: meta.title,
            thumbnail_url: meta.thumbnail_url,
            start_ms: 0,
        };
        const response = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/clips`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to create clip: ${response.status} ${errorText}`);
        }
        const clip = await response.json();
        // If active section provided, assign clip to that section
        if (activeSection) {
            try {
                const assignResponse = await fetch(`${api_1.API_BASE}/sessions/${sessionId}/assembly/section-clip`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`,
                    },
                    body: JSON.stringify({
                        clip_id: clip.id,
                        section_label: activeSection,
                    }),
                });
                if (!assignResponse.ok) {
                    console.warn('Failed to assign clip to section:', assignResponse.status, await assignResponse.text());
                }
            }
            catch (error) {
                console.warn('Error assigning clip to section:', error);
            }
        }
        return clip;
    };
    const handleShareUrl = async (url, activeSection) => {
        try {
            const meta = await fetchOEmbedMetadata(url);
            const activeSessionId = (0, storage_1.getActiveSessionId)();
            if (activeSessionId) {
                // Get active section from storage if not provided, using new getActiveSectionId function
                const currentActiveSection = activeSection || (0, storage_1.getActiveSectionId)() || (0, storage_1.getActiveSection)(activeSessionId) || undefined;
                await createRefClip(activeSessionId, url, meta, currentActiveSection);
                react_native_toast_message_1.default.show({
                    type: 'success',
                    text1: 'Clip added to session',
                });
                // Only exit app after successful clip creation
                exitTimerRef.current = setTimeout(() => {
                    try {
                        react_native_1.BackHandler.exitApp();
                    }
                    catch (e) {
                        console.warn('[share] exitApp failed:', e);
                    }
                }, 1500);
            }
            else {
                pendingShareRef.current = { url, meta };
                setPendingShareUrl(url);
                setPendingShareMeta(meta);
                router.replace('/(app)');
            }
        }
        catch (error) {
            console.error('Error handling share URL:', error);
            react_native_toast_message_1.default.show({
                type: 'error',
                text1: 'Failed to add clip',
                text2: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    };
    const extractSharedUrl = (urlString) => {
        try {
            const url = new URL(urlString);
            // If the protocol is http/https, the entire URL is the shared content
            if (url.protocol === 'http:' || url.protocol === 'https:') {
                return urlString;
            }
            // For deep links, extract url/text query parameters
            const candidate = url.searchParams.get('url') ?? url.searchParams.get('text');
            if (candidate) {
                // If candidate is already a valid http/https URL, return it directly
                try {
                    const candidateUrl = new URL(candidate);
                    if (candidateUrl.protocol === 'http:' || candidateUrl.protocol === 'https:') {
                        return candidate;
                    }
                }
                catch {
                    // Not a valid URL, continue to regex extraction
                }
                // Extract first http/https URL from the text
                const match = candidate.match(/https?:\/\/[^\s]+/);
                return match ? match[0] : null;
            }
            return null;
        }
        catch (error) {
            // Last resort: apply regex directly to raw input for malformed URLs
            const match = urlString.match(/https?:\/\/[^\s]+/);
            return match ? match[0] : null;
        }
    };
    const clearPendingShare = () => {
        pendingShareRef.current = null;
        setPendingShareUrl(null);
        setPendingShareMeta(null);
    };
    const getPendingShare = () => {
        return pendingShareRef.current;
    };
    (0, react_1.useEffect)(() => {
        const handleInitialUrl = async () => {
            const initialUrl = await react_native_1.Linking.getInitialURL();
            if (initialUrl) {
                const sharedUrl = extractSharedUrl(initialUrl);
                if (sharedUrl) {
                    setInitialSharedUrl(sharedUrl);
                }
            }
        };
        const subscription = react_native_1.Linking.addEventListener('url', async (event) => {
            const sharedUrl = extractSharedUrl(event.url);
            if (sharedUrl) {
                await handleShareUrl(sharedUrl);
            }
        });
        handleInitialUrl();
        return () => {
            subscription?.remove();
            if (exitTimerRef.current) {
                clearTimeout(exitTimerRef.current);
            }
        };
    }, []);
    // Process initial shared URL only when auth is ready
    (0, react_1.useEffect)(() => {
        if (initialSharedUrl && !initialUrlProcessed && session?.access_token) {
            setInitialUrlProcessed(true);
            handleShareUrl(initialSharedUrl);
        }
    }, [initialSharedUrl, initialUrlProcessed, session?.access_token]);
    return {
        pendingShareUrl,
        pendingShareMeta,
        clearPendingShare,
        getPendingShare,
        createRefClip,
        handleShareUrl,
    };
}
exports.useShareIntent = useShareIntent;
//# sourceMappingURL=useShareIntent.js.map