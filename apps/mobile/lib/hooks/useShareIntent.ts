import { useEffect, useRef, useState } from 'react';
import { Linking, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from './useSession';
import { getActiveSessionId, getActiveSection, getActiveSectionId } from '../storage';
import { API_BASE } from '../api';
import Toast from 'react-native-toast-message';

interface OEmbedMetadata {
  title: string;
  thumbnail_url: string | null;
}

interface PendingShare {
  url: string;
  meta: OEmbedMetadata;
}

export function useShareIntent() {
  const router = useRouter();
  const { session } = useSession();
  const pendingShareRef = useRef<PendingShare | null>(null);
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [pendingShareUrl, setPendingShareUrl] = useState<string | null>(null);
  const [pendingShareMeta, setPendingShareMeta] = useState<OEmbedMetadata | null>(null);
  const [initialSharedUrl, setInitialSharedUrl] = useState<string | null>(null);
  const [initialUrlProcessed, setInitialUrlProcessed] = useState(false);

  const fetchOEmbedMetadata = async (url: string): Promise<OEmbedMetadata> => {
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
    } catch (error) {
      console.warn('Failed to fetch oEmbed metadata:', error);
      return { title: url, thumbnail_url: null };
    }
  };

  const createRefClip = async (sessionId: string, url: string, meta: OEmbedMetadata, activeSection?: string) => {
    if (!session?.access_token) {
      throw new Error('No auth session');
    }

    const payload = {
      local_id: crypto.randomUUID(),
      recorded_at: new Date().toISOString(),
      label: 'REF',
      clip_type: 'REF' as const,
      url,
      title: meta.title,
      thumbnail_url: meta.thumbnail_url,
      start_ms: 0,
    };

    const response = await fetch(`${API_BASE}/sessions/${sessionId}/clips`, {
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
        const assignResponse = await fetch(`${API_BASE}/sessions/${sessionId}/assembly/section-clip`, {
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
      } catch (error) {
        console.warn('Error assigning clip to section:', error);
      }
    }

    return clip;
  };

  const handleShareUrl = async (url: string, activeSection?: string) => {
    try {
      const meta = await fetchOEmbedMetadata(url);
      const activeSessionId = getActiveSessionId();

      if (activeSessionId) {
        // Get active section from storage if not provided, using new getActiveSectionId function
        const currentActiveSection = activeSection || getActiveSectionId() || getActiveSection(activeSessionId) || undefined;
        await createRefClip(activeSessionId, url, meta, currentActiveSection);
        Toast.show({
          type: 'success',
          text1: 'Clip added to session',
        });
        // Only exit app after successful clip creation
        exitTimerRef.current = setTimeout(() => {
          try {
            BackHandler.exitApp();
          } catch (e) {
            console.warn('[share] exitApp failed:', e);
          }
        }, 1500);
      } else {
        pendingShareRef.current = { url, meta };
        setPendingShareUrl(url);
        setPendingShareMeta(meta);
        router.replace('/(app)');
      }
    } catch (error) {
      console.error('Error handling share URL:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to add clip',
        text2: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const extractSharedUrl = (urlString: string): string | null => {
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
        } catch {
          // Not a valid URL, continue to regex extraction
        }
        
        // Extract first http/https URL from the text
        const match = candidate.match(/https?:\/\/[^\s]+/);
        return match ? match[0] : null;
      }
      
      return null;
    } catch (error) {
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

  useEffect(() => {
    const handleInitialUrl = async () => {
      const initialUrl = await Linking.getInitialURL();
      if (initialUrl) {
        const sharedUrl = extractSharedUrl(initialUrl);
        if (sharedUrl) {
          setInitialSharedUrl(sharedUrl);
        }
      }
    };

    const subscription = Linking.addEventListener('url', async (event: any) => {
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
  useEffect(() => {
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
