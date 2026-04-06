import { useEffect, useRef, useState } from 'react';
import { Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { useSession } from './useSession';
import { getActiveSessionId } from '../storage';
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
  const [pendingShareUrl, setPendingShareUrl] = useState<string | null>(null);
  const [pendingShareMeta, setPendingShareMeta] = useState<OEmbedMetadata | null>(null);

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

  const createRefClip = async (sessionId: string, url: string, meta: OEmbedMetadata) => {
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

    return response.json();
  };

  const handleShareUrl = async (url: string) => {
    try {
      const meta = await fetchOEmbedMetadata(url);
      const activeSessionId = getActiveSessionId();

      if (activeSessionId) {
        await createRefClip(activeSessionId, url, meta);
        Toast.show({
          type: 'success',
          text1: 'Clip added to session',
        });
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
        const url = new URL(initialUrl);
        const sharedUrl = url.searchParams.get('url') || url.searchParams.get('text');
        if (sharedUrl) {
          await handleShareUrl(sharedUrl);
        }
      }
    };

    const subscription = Linking.addEventListener('url', async (event: any) => {
      const url = new URL(event.url);
      const sharedUrl = url.searchParams.get('url') || url.searchParams.get('text');
      if (sharedUrl) {
        await handleShareUrl(sharedUrl);
      }
    });

    handleInitialUrl();

    return () => {
      subscription?.remove();
    };
  }, []);

  return {
    pendingShareUrl,
    pendingShareMeta,
    clearPendingShare,
    getPendingShare,
    createRefClip,
  };
}
