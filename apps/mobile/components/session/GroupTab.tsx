import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Image, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { useSession } from '../../lib/hooks/useSession';
import { useGroupRealtime } from '../../lib/hooks/useGroupRealtime';
import { supabase } from '../../lib/supabase';
import { theme } from '../../lib/theme';

const colors = theme.light;

interface Dancer {
  id: string;
  userId: string;
  name: string;
  color: string;
  online: boolean;
  positionX: number | null;
  positionY: number | null;
  positionNote: string | null;
}

interface PresenceEntry {
  userId: string;
  name: string;
  color: string;
  online: boolean;
}

interface RealtimeNote {
  text: string;
  receivedAt: string;
  senderUserId?: string | null;
  eventId?: string | null;
}

interface ClipIdentity {
  participant_id?: string | null;
  participantId?: string | null;
  dancer_id?: string | null;
  dancerId?: string | null;
  user_id?: string | null;
  userId?: string | null;
  owner_user_id?: string | null;
  dancer_color?: string | null;
  color?: string | null;
}

const DANCER_POSITION_FALLBACKS: Array<{ top: number; left: number }> = [
  { top: 30, left: 20 },
  { top: 45, left: 40 },
  { top: 60, left: 60 },
  { top: 75, left: 80 },
  { top: 35, left: 70 },
  { top: 68, left: 25 },
  { top: 52, left: 82 },
  { top: 24, left: 50 },
];

const FALLBACK_DANCERS: Dancer[] = [
  { id: 'd1', userId: 'd1', name: 'Amber', color: '#7FD1BF', online: true, positionX: null, positionY: null, positionNote: null },
  { id: 'd2', userId: 'd2', name: 'Jules', color: '#F08A6C', online: true, positionX: null, positionY: null, positionNote: null },
  { id: 'd3', userId: 'd3', name: 'Maya', color: '#8C6CE7', online: false, positionX: null, positionY: null, positionNote: null },
  { id: 'd4', userId: 'd4', name: 'Noah', color: '#56B3FF', online: false, positionX: null, positionY: null, positionNote: null },
];

function getDancerPosition(dancer: Dancer, fallbackIndex: number): { top: number; left: number } {
  if (typeof dancer.positionX === 'number' && typeof dancer.positionY === 'number') {
    return { left: dancer.positionX, top: dancer.positionY };
  }
  return DANCER_POSITION_FALLBACKS[fallbackIndex % DANCER_POSITION_FALLBACKS.length] ?? { top: 30, left: 20 };
}

function getDancerBadge(dancer: Dancer, fallbackIndex: number): string {
  const initial = dancer.name.trim().charAt(0).toUpperCase();
  if (initial) return initial;
  return String(fallbackIndex + 1);
}

function getDancerForClip(clip: ClipIdentity, dancers: Dancer[], participants: Array<{ id: string; user_id: string }>): Dancer | null {
  const participantId = clip.participant_id ?? clip.participantId ?? clip.dancer_id ?? clip.dancerId;
  const participantMatch = participantId ? participants.find((participant) => participant.id === participantId) : null;
  const resolvedUserId = participantMatch?.user_id ?? clip.user_id ?? clip.userId ?? clip.owner_user_id ?? null;
  return (
    dancers.find((dancer) => Boolean(resolvedUserId) && dancer.userId === resolvedUserId) ??
    dancers.find((dancer) => Boolean(clip.dancer_color) && dancer.color.toLowerCase() === String(clip.dancer_color).toLowerCase()) ??
    dancers.find((dancer) => Boolean(clip.color) && dancer.color.toLowerCase() === String(clip.color).toLowerCase()) ??
    null
  );
}

export function GroupTab() {
  const router = useRouter();
  const { share_token, token } = useLocalSearchParams<{ share_token?: string; token?: string }>();
  const inviteShareToken =
    typeof share_token === 'string' && share_token.length > 0
      ? share_token
      : typeof token === 'string' && token.length > 0
        ? token
        : null;
  const { session } = useSession();
  const {
    sessionId,
    activeSection,
    setActiveSection,
    activeMoment,
    setActiveMoment,
    moments,
    createMoment,
    renameMoment,
    clips,
    loopRegion,
    openClipSheet,
    musicTrack,
    openSheet,
  } = useSessionContext();
  const { participants, myParticipant, isChoreographer, broadcasts, sendBroadcast, updatePosition } = useGroupRealtime(
    sessionId,
    session?.access_token,
    inviteShareToken
  );

  void createMoment;
  const [renamingMomentId, setRenamingMomentId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [broadcastText, setBroadcastText] = useState('');
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceEntry>>({});
  const [presenceUnavailable, setPresenceUnavailable] = useState(false);
  const [broadcastNotes, setBroadcastNotes] = useState<RealtimeNote[]>([]);
  const [activeFormationBroadcast, setActiveFormationBroadcast] = useState<{ momentId: string | null; section: string | null } | null>(null);
  const [newClipCue, setNewClipCue] = useState(false);
  const [broadcastHint, setBroadcastHint] = useState<string | null>(null);
  const [selectedDancerId, setSelectedDancerId] = useState<string | null>(null);
  const [latestIncomingNote, setLatestIncomingNote] = useState<RealtimeNote | null>(null);
  const pulseValuesRef = useRef<Record<string, Animated.Value>>({});
  const newNoteOpacity = useRef(new Animated.Value(0)).current;
  const newNoteTranslateY = useRef(new Animated.Value(-10)).current;
  const highlightedNoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestBroadcastKeyRef = useRef<string | null>(null);
  const hasHydratedBroadcastBaselineRef = useRef(false);
  const knownClipIdsRef = useRef<Set<string>>(new Set());
  const prevClipsLengthRef = useRef(clips.length);
  const channelRef = useRef<ReturnType<NonNullable<typeof supabase>['channel']> | null>(null);
  const participantByIdRef = useRef<Map<string, (typeof participants)[number]>>(new Map());
  const participantByUserIdRef = useRef<Map<string, (typeof participants)[number]>>(new Map());
  const setActiveMomentRef = useRef(setActiveMoment);
  const setActiveSectionRef = useRef(setActiveSection);
  const myPresenceRef = useRef<{ name: string; color: string }>({ name: 'User', color: colors.mine });
  const suppressFormationEmitRef = useRef(false);
  const myUserId = myParticipant?.user_id ?? session?.user?.id ?? null;

  const dancers = useMemo<Dancer[]>(() => {
    if (participants.length > 0) {
      return participants.map((participant) => {
        const presence = presenceMap[participant.user_id];
        return {
          id: participant.id,
          userId: participant.user_id,
          name: participant.display_name || presence?.name || 'User',
          color: participant.color || presence?.color || colors.mine,
          online: presence?.online ?? (presenceUnavailable ? participant.user_id === myUserId : false),
          positionX: participant.position_x ?? null,
          positionY: participant.position_y ?? null,
          positionNote: participant.position_note ?? null,
        };
      });
    }

    const liveDancers = Object.values(presenceMap).map((presence) => ({
      id: presence.userId,
      userId: presence.userId,
      name: presence.name || 'User',
      color: presence.color || colors.mine,
      online: presence.online,
      positionX: null,
      positionY: null,
      positionNote: null,
    }));
    if (liveDancers.length > 0) return liveDancers;
    return FALLBACK_DANCERS;
  }, [myUserId, participants, presenceMap, presenceUnavailable]);

  const receivedNotes = useMemo(() => {
    const normalizeText = (value: string) => value.trim().slice(0, 60);
    const identityText = (value: string) => value.toLowerCase();
    const merged = [
      ...broadcasts.map((entry, index) => {
        const text = normalizeText(entry.message);
        const parsed = Date.parse(entry.created_at);
        return {
          text,
          timestamp: Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER - (broadcasts.length - index) : parsed,
          sourceOrder: index,
          eventKey: `db:${entry.id}`,
          transportKey: entry.sender_id ? `${entry.sender_id}:${entry.created_at}:${identityText(text)}` : null,
        };
      }),
      ...broadcastNotes.map((entry, index) => {
        const parsed = Date.parse(entry.receivedAt);
        const text = normalizeText(entry.text);
        const senderIdentity = entry.senderUserId ?? 'unknown';
        return {
          text,
          timestamp: Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER - (broadcastNotes.length - index) : parsed,
          sourceOrder: broadcasts.length + index,
          eventKey: entry.eventId ? `rt-id:${entry.eventId}` : `rt:${senderIdentity}:${entry.receivedAt}:${index}`,
          transportKey: entry.senderUserId ? `${entry.senderUserId}:${entry.receivedAt}:${identityText(text)}` : null,
        };
      }),
    ]
      .filter((entry) => Boolean(entry.text))
      .sort((a, b) => a.timestamp - b.timestamp || a.sourceOrder - b.sourceOrder);

    const deduped: string[] = [];
    const seenEventKeys = new Set<string>();
    const seenTransportKeys = new Set<string>();
    for (const entry of merged) {
      if (seenEventKeys.has(entry.eventKey)) continue;
      if (entry.transportKey && seenTransportKeys.has(entry.transportKey)) continue;
      seenEventKeys.add(entry.eventKey);
      if (entry.transportKey) seenTransportKeys.add(entry.transportKey);
      deduped.push(entry.text);
    }

    if (deduped.length > 0) return deduped;
    return ['no notes yet'];
  }, [broadcastNotes, broadcasts]);
  const myDancer = useMemo(
    () =>
      dancers.find((dancer) => dancer.id === myParticipant?.id) ??
      dancers.find((dancer) => dancer.userId === session?.user?.id) ??
      null,
    [dancers, myParticipant?.id, session?.user?.id]
  );
  const positionNote = myDancer?.positionNote?.trim() || 'awaiting position note from choreographer';

  const sections = musicTrack?.sections || [
    { label: 'INTRO' },
    { label: 'VERSE' },
    { label: 'CHORUS' },
    { label: 'BRIDGE' },
    { label: 'OUTRO' },
  ];

  const handleMomentPress = (momentId: string) => setActiveMoment(momentId);
  const handleMomentLongPress = (momentId: string) => setRenamingMomentId(momentId);
  const handleRenameMoment = useCallback(
    (newLabel: string) => {
      if (!renamingMomentId) return;
      void renameMoment(renamingMomentId, newLabel);
      setRenamingMomentId(null);
    },
    [renamingMomentId, renameMoment]
  );

  const handleBroadcast = async () => {
    if (!broadcastText.trim() || broadcastText.length > 60) return;
    const text = broadcastText.trim();
    const notePayload = {
      text,
      senderUserId: myUserId,
      sentAt: new Date().toISOString(),
    };

    let liveSendSucceeded = false;
    const channel = channelRef.current;
    if (channel) {
      const status = await channel.send({
        type: 'broadcast',
        event: 'group:note',
        payload: notePayload,
      });
      liveSendSucceeded = status === 'ok';
    }

    const persisted = await sendBroadcast(text);
    if (persisted) {
      if (!liveSendSucceeded) {
        setBroadcastNotes((prev) => [...prev, { text, receivedAt: notePayload.sentAt, senderUserId: myUserId }]);
      }
      setBroadcastText('');
      setBroadcastHint(liveSendSucceeded ? null : channel ? 'live send unavailable, note saved' : null);
      return;
    }

    if (liveSendSucceeded) {
      setBroadcastHint('sent live, but failed to save to history - retry');
      return;
    }
    setBroadcastHint('send failed, retry');
  };

  const handleRecordPress = () => {
    router.push({
      pathname: './camera',
      params: { id: sessionId, sectionName: activeSection },
    });
  };

  const handleFloorCanvasPress = useCallback(
    (event: { nativeEvent: { locationX: number; locationY: number } }) => {
      if (!myParticipant) return;
      const { width, height } = canvasSize;
      if (!width || !height) return;

      const normalizedX = Math.max(0, Math.min(100, (event.nativeEvent.locationX / width) * 100));
      const normalizedY = Math.max(0, Math.min(100, (event.nativeEvent.locationY / height) * 100));
      const note = `${Math.round(normalizedX)}%, ${Math.round(normalizedY)}%`;
      void updatePosition(normalizedX, normalizedY, note);
    },
    [canvasSize, myParticipant, updatePosition]
  );

  const renderGridLines = () => {
    if (!canvasSize.width || !canvasSize.height) return null;
    const horizontalLines = [];
    const verticalLines = [];

    for (let y = 22; y < canvasSize.height; y += 22) {
      horizontalLines.push(
        <View key={`h-${y}`} style={[styles.gridLine, styles.horizontalGridLine, { top: y, width: canvasSize.width }]} />
      );
    }

    for (let x = 22; x < canvasSize.width; x += 22) {
      verticalLines.push(
        <View key={`v-${x}`} style={[styles.gridLine, styles.verticalGridLine, { left: x, height: canvasSize.height }]} />
      );
    }

    return [...horizontalLines, ...verticalLines];
  };

  const renderWaveformBars = () => {
    const heights = [12, 24, 18, 30, 16, 28, 20, 26, 14, 22, 18, 25];
    return heights.map((height, index) => (
      <View key={index} style={[styles.waveformBar, { height, backgroundColor: colors.muted }]} />
    ));
  };

  useEffect(() => {
    participantByIdRef.current = new Map(participants.map((participant) => [participant.id, participant]));
    participantByUserIdRef.current = new Map(participants.map((participant) => [participant.user_id, participant]));
  }, [participants]);

  useEffect(() => {
    setActiveMomentRef.current = setActiveMoment;
    setActiveSectionRef.current = setActiveSection;
  }, [setActiveMoment, setActiveSection]);

  useEffect(() => {
    myPresenceRef.current = {
      name: myParticipant?.display_name ?? session?.user?.email?.split('@')[0] ?? 'User',
      color: myParticipant?.color ?? colors.mine,
    };

    if (!channelRef.current || !myUserId) return;
    void channelRef.current.track({
      userId: myUserId,
      name: myPresenceRef.current.name,
      color: myPresenceRef.current.color,
      online: true,
    });
  }, [myParticipant?.color, myParticipant?.display_name, myUserId, session?.user?.email]);

  useEffect(() => {
    if (!supabase || !sessionId) {
      setPresenceUnavailable(true);
      return;
    }
    const resolvePresenceUserId = (key: unknown, latest?: Record<string, unknown>) => {
      const payloadUserId =
        (latest?.userId as string | undefined) ??
        (latest?.user_id as string | undefined) ??
        null;
      if (payloadUserId) return payloadUserId;
      if (typeof key === 'string' && key) {
        if (participantByUserIdRef.current.has(key)) return key;
        const participant = participantByIdRef.current.get(key);
        if (participant?.user_id) return participant.user_id;
      }
      return null;
    };

    const channel = supabase
      .channel(`group:session:${sessionId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const next: Record<string, PresenceEntry> = {};
        for (const [presenceKey, presences] of Object.entries(state)) {
          const latest = Array.isArray(presences) ? (presences[presences.length - 1] as Record<string, unknown> | undefined) : undefined;
          const userId = resolvePresenceUserId(presenceKey, latest);
          if (!userId) continue;
          next[userId] = {
            userId,
            name: (latest?.name as string | undefined) ?? next[userId]?.name ?? 'User',
            color: (latest?.color as string | undefined) ?? next[userId]?.color ?? colors.mine,
            online: true,
          };
        }
        setPresenceMap(next);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        const presences = Array.isArray(newPresences) ? (newPresences as Array<Record<string, unknown>>) : [];
        const latest = presences[presences.length - 1];
        const userId = resolvePresenceUserId(key, latest);
        if (!userId) return;
        setPresenceMap((prev) => ({
          ...prev,
          [userId]: {
            userId,
            name: (latest?.name as string | undefined) ?? prev[userId]?.name ?? 'User',
            color: (latest?.color as string | undefined) ?? prev[userId]?.color ?? colors.mine,
            online: true,
          },
        }));
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        const presences = Array.isArray(leftPresences) ? (leftPresences as Array<Record<string, unknown>>) : [];
        const latest = presences[presences.length - 1];
        const userId = resolvePresenceUserId(key, latest);
        if (!userId) return;
        setPresenceMap((prev) => {
          if (!prev[userId]) return prev;
          return {
            ...prev,
            [userId]: {
              ...prev[userId],
              online: false,
            },
          };
        });
      })
      .on('broadcast', { event: 'group:note' }, ({ payload }) => {
        const text = typeof payload?.text === 'string' ? payload.text.trim().slice(0, 60) : '';
        if (!text) return;
        setBroadcastNotes((prev) => [
          ...prev,
          {
            text,
            receivedAt: typeof payload?.sentAt === 'string' ? payload.sentAt : new Date().toISOString(),
            senderUserId:
              typeof payload?.senderUserId === 'string'
                ? payload.senderUserId
                : typeof payload?.sender_user_id === 'string'
                  ? payload.sender_user_id
                  : null,
            eventId:
              typeof payload?.id === 'string'
                ? payload.id
                : typeof payload?.broadcastId === 'string'
                  ? payload.broadcastId
                  : null,
          },
        ]);
      })
      .on('broadcast', { event: 'group:formation' }, ({ payload }) => {
        const momentId = typeof payload?.momentId === 'string' ? payload.momentId : null;
        const section = typeof payload?.section === 'string' ? payload.section : null;
        setActiveFormationBroadcast({ momentId, section });
        suppressFormationEmitRef.current = true;
        setActiveMomentRef.current(momentId);
        if (section) setActiveSectionRef.current(section);
      });

    channelRef.current = channel;
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        setPresenceUnavailable(false);
        if (!myUserId) return;
        await channel.track({
          userId: myUserId,
          name: myPresenceRef.current.name,
          color: myPresenceRef.current.color,
          online: true,
        });
        return;
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        setPresenceUnavailable(true);
      }
    });

    return () => {
      channelRef.current = null;
      supabase?.removeChannel(channel);
    };
  }, [myUserId, sessionId]);

  useEffect(() => {
    if (suppressFormationEmitRef.current) {
      suppressFormationEmitRef.current = false;
      return;
    }
    if (!channelRef.current || activeMoment === null) return;
    void channelRef.current.send({
      type: 'broadcast',
      event: 'group:formation',
      payload: {
        momentId: activeMoment,
        section: activeSection,
        senderUserId: myUserId,
      },
    });
  }, [activeMoment, activeSection, myUserId]);

  useEffect(() => {
    const previousLength = prevClipsLengthRef.current;
    if (clips.length > previousLength) {
      setNewClipCue(true);
      const timer = setTimeout(() => setNewClipCue(false), 2_000);
      prevClipsLengthRef.current = clips.length;
      return () => clearTimeout(timer);
    }
    prevClipsLengthRef.current = clips.length;
    return undefined;
  }, [clips.length]);

  useEffect(() => {
    for (const dancer of dancers) {
      if (!pulseValuesRef.current[dancer.id]) {
        pulseValuesRef.current[dancer.id] = new Animated.Value(1);
      }
    }
  }, [dancers]);

  useEffect(() => {
    const known = knownClipIdsRef.current;
    if (known.size === 0) {
      for (const clip of clips) known.add(clip.local_id);
      return;
    }

    for (const clip of clips) {
      if (known.has(clip.local_id)) continue;
      known.add(clip.local_id);

      const clipAny = clip as unknown as ClipIdentity;
      const matched = getDancerForClip(clipAny, dancers, participants);
      if (!matched) continue;

      const pulse = pulseValuesRef.current[matched.id] ?? new Animated.Value(1);
      pulseValuesRef.current[matched.id] = pulse;
      pulse.setValue(1);
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.25, duration: 130, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
    }
  }, [clips, dancers, participants]);

  useEffect(() => {
    const merged = [
      ...broadcasts.map((entry, index) => ({
        text: entry.message.trim().slice(0, 60),
        receivedAt: entry.created_at,
        sourceOrder: index,
      })),
      ...broadcastNotes.map((entry, index) => ({
        text: entry.text.trim().slice(0, 60),
        receivedAt: entry.receivedAt,
        sourceOrder: broadcasts.length + index,
      })),
    ]
      .filter((entry) => Boolean(entry.text))
      .sort((a, b) => {
        const aTs = Date.parse(a.receivedAt);
        const bTs = Date.parse(b.receivedAt);
        const aSafe = Number.isNaN(aTs) ? Number.MAX_SAFE_INTEGER : aTs;
        const bSafe = Number.isNaN(bTs) ? Number.MAX_SAFE_INTEGER : bTs;
        return aSafe - bSafe || a.sourceOrder - b.sourceOrder;
      });
    const latest = merged[merged.length - 1];
    if (!latest) return;

    const latestKey = `${latest.receivedAt}:${latest.text}`;
    if (!hasHydratedBroadcastBaselineRef.current) {
      // First historical hydration should establish baseline silently.
      if (broadcastNotes.length === 0) {
        latestBroadcastKeyRef.current = latestKey;
        hasHydratedBroadcastBaselineRef.current = true;
        return;
      }
      hasHydratedBroadcastBaselineRef.current = true;
    }

    if (latestBroadcastKeyRef.current === latestKey) return;
    latestBroadcastKeyRef.current = latestKey;

    setLatestIncomingNote({ text: latest.text, receivedAt: latest.receivedAt });
    newNoteOpacity.setValue(0);
    newNoteTranslateY.setValue(-10);
    Animated.parallel([
      Animated.timing(newNoteOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(newNoteTranslateY, {
        toValue: 0,
        duration: 220,
        useNativeDriver: true,
      }),
    ]).start();
    if (highlightedNoteTimerRef.current) clearTimeout(highlightedNoteTimerRef.current);
    highlightedNoteTimerRef.current = setTimeout(() => {
      Animated.timing(newNoteOpacity, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }).start(() => {
        setLatestIncomingNote(null);
      });
    }, 4000);
  }, [broadcastNotes, broadcasts, newNoteOpacity, newNoteTranslateY]);

  useEffect(() => {
    return () => {
      if (highlightedNoteTimerRef.current) clearTimeout(highlightedNoteTimerRef.current);
    };
  }, []);

  if (isChoreographer) {
    return (
      <View style={styles.container}>
        <View style={styles.choreographerHeader}>
          <View style={styles.choreographerHeaderActions}>
            <TouchableOpacity style={styles.headerIconButton} onPress={() => openSheet('share')} activeOpacity={0.8}>
              <Text style={styles.headerIcon}>↗</Text>
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.leftPanel}>
          <ScrollView horizontal style={styles.sectionStrip} showsHorizontalScrollIndicator={false}>
            {sections.map((section) => (
              <TouchableOpacity
                key={section.label}
                style={[styles.sectionChip, activeSection === section.label && styles.sectionChipActive]}
                onPress={() => setActiveSection(section.label)}
              >
                <Text style={[styles.sectionChipText, activeSection === section.label && styles.sectionChipTextActive]}>
                  {section.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View
            style={styles.floorCanvas}
            onLayout={(e) => setCanvasSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
            onTouchEnd={handleFloorCanvasPress}
          >
            {renderGridLines()}
            {dancers.map((dancer, index) => {
              const position = getDancerPosition(dancer, index);
              const pulse = pulseValuesRef.current[dancer.id] ?? new Animated.Value(1);
              pulseValuesRef.current[dancer.id] = pulse;
              const isSelected = dancer.id === selectedDancerId;
              return (
                <Animated.View
                  key={dancer.id}
                  style={[
                    styles.dancerDot,
                    isSelected && styles.selectedDancerDot,
                    {
                      backgroundColor: dancer.color,
                      top: `${position.top}%`,
                      left: `${position.left}%`,
                      opacity: Animated.multiply(pulse, dancer.online ? 1 : 0.3),
                    },
                  ]}
                >
                  <Text style={styles.dancerInitial}>{getDancerBadge(dancer, index)}</Text>
                </Animated.View>
              );
            })}
            <Text style={styles.backstageLabel}>backstage</Text>
            <Text style={styles.audienceLabel}>audience</Text>
          </View>

          <ScrollView horizontal style={styles.momentStrip} showsHorizontalScrollIndicator={false}>
            {moments.map((moment) => (
              <TouchableOpacity
                key={moment.id}
                style={[styles.momentChip, activeMoment === moment.id && styles.momentChipActive]}
                onPress={() => handleMomentPress(moment.id)}
                onLongPress={() => handleMomentLongPress(moment.id)}
              >
                {renamingMomentId === moment.id ? (
                  <TextInput
                    style={styles.renameInput}
                    defaultValue={moment.name}
                    onBlur={(event) => handleRenameMoment(event.nativeEvent.text)}
                    onSubmitEditing={(event) => handleRenameMoment(event.nativeEvent.text)}
                    autoFocus
                  />
                ) : (
                  <Text style={[styles.momentChipText, activeMoment === moment.id && styles.momentChipTextActive]}>
                    {moment.name}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.rightPanel}>
          <View style={styles.miniWaveform}>{renderWaveformBars()}</View>
          <Text style={styles.loopStatus}>{loopRegion ? 'loop 1 active' : ''}</Text>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.roster}>
            {dancers.map((dancer) => (
              <TouchableOpacity
                key={dancer.id}
                style={[styles.rosterRow, dancer.id === selectedDancerId && styles.rosterRowSelected]}
                onPress={() => setSelectedDancerId((prev) => (prev === dancer.id ? null : dancer.id))}
                activeOpacity={0.85}
              >
                <View style={[styles.rosterDot, { backgroundColor: dancer.color, opacity: dancer.online ? 1 : 0.3 }]} />
                <Text style={styles.rosterName}>{dancer.name}</Text>
                <Text style={styles.rosterStatus}>{dancer.online ? '● active' : 'offline'}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.broadcastRow}>
            <TextInput
              style={styles.broadcastInput}
              value={broadcastText}
              onChangeText={(text) => {
                setBroadcastText(text);
                if (broadcastHint) setBroadcastHint(null);
              }}
              placeholder="send note to all dancers..."
              placeholderTextColor={colors.muted}
              maxLength={60}
            />
            {broadcastText.length > 0 && <Text style={styles.charCount}>{broadcastText.length}/60</Text>}
            <TouchableOpacity style={styles.broadcastButton} onPress={handleBroadcast}>
              <Text style={styles.broadcastButtonText}>→ all</Text>
            </TouchableOpacity>
          </View>
          {broadcastHint ? <Text style={styles.broadcastHint}>{broadcastHint}</Text> : null}
          <View style={styles.receivedNotesPanel}>
            <Text style={styles.receivedNotesHeader}>received notes</Text>
            <ScrollView style={styles.receivedNotesList} showsVerticalScrollIndicator={false}>
              {receivedNotes.map((note, index) => (
                <Text key={`${note}-${index}`} style={styles.receivedNoteText}>
                  {note}
                </Text>
              ))}
            </ScrollView>
          </View>

          <TouchableOpacity style={styles.recordFab} onPress={handleRecordPress}>
            <View style={styles.recordFabInner} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.dancerContainer}>
      <View
        style={styles.dancerFloorCanvas}
        onLayout={(e) => setCanvasSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
        onTouchEnd={handleFloorCanvasPress}
      >
        {renderGridLines()}
        {dancers.map((dancer, index) => {
          const isSelf = dancer.id === myParticipant?.id;
          const position = getDancerPosition(dancer, index);
          const pulse = pulseValuesRef.current[dancer.id] ?? new Animated.Value(1);
          pulseValuesRef.current[dancer.id] = pulse;
          return (
            <Animated.View
              key={dancer.id}
              style={[
                styles.dancerDot,
                isSelf ? styles.selfDot : styles.otherDot,
                {
                  backgroundColor: dancer.color,
                  top: `${position.top}%`,
                  left: `${position.left}%`,
                  opacity: Animated.multiply(pulse, dancer.online ? 1 : 0.3),
                },
              ]}
            >
              <Text style={styles.dancerInitial}>{getDancerBadge(dancer, index)}</Text>
            </Animated.View>
          );
        })}
        <Text style={styles.backstageLabel}>backstage</Text>
        <Text style={styles.audienceLabel}>audience</Text>
      </View>

      <View style={styles.positionNoteBand}>
        <Text style={styles.positionNoteText}>{positionNote}</Text>
      </View>

      <View style={styles.dancerRightPanel}>
        <View style={styles.choreographerNotes}>
          <Text style={styles.choreographerNotesHeader}>CHOREOGRAPHER NOTES</Text>
          {activeFormationBroadcast ? (
            <Text style={styles.activeMomentHint}>
              live formation: {activeFormationBroadcast.momentId ?? 'none'} / {activeFormationBroadcast.section ?? 'section'}
            </Text>
          ) : null}
          {latestIncomingNote ? (
            <Animated.View style={[styles.newNoteSlideIn, { opacity: newNoteOpacity, transform: [{ translateY: newNoteTranslateY }] }]}>
              <Text style={styles.choreographerNoteText}>{latestIncomingNote.text}</Text>
            </Animated.View>
          ) : null}
          <ScrollView showsVerticalScrollIndicator={false}>
            {receivedNotes.map((note, index) => (
              <Text key={`${note}-${index}`} style={styles.choreographerNoteText}>
                {note}
              </Text>
            ))}
          </ScrollView>
        </View>

        <View style={styles.clipsGridLabelRow}>
          <Text style={styles.clipsGridLabel}>ALL TAKES</Text>
          {newClipCue ? <Text style={styles.newClipCue}>● new</Text> : null}
        </View>
        <FlatList
          data={clips}
          keyExtractor={(clip) => clip.local_id}
          numColumns={2}
          columnWrapperStyle={{ gap: 8 }}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item, index }) => {
            const dancerForClip = getDancerForClip(item as ClipIdentity, dancers, participants);
            const dancerBadge = dancerForClip ? getDancerBadge(dancerForClip, index) : String(index + 1);
            const badgeColor = dancerForClip?.color ?? colors.mine;
            return (
              <TouchableOpacity
                style={[styles.clipThumb, { borderWidth: 1.5, borderColor: badgeColor }]}
                onPress={() => openClipSheet(item)}
                activeOpacity={0.85}
              >
                {item.mux_playback_id ? (
                  <Image source={{ uri: `https://image.mux.com/${item.mux_playback_id}/thumbnail.jpg?time=0` }} style={styles.clipThumbImage} />
                ) : null}
                <View style={styles.clipDancerInitialBadge}>
                  <Text style={[styles.clipDancerInitialText, { color: badgeColor }]}>{dancerBadge}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />

        <View style={styles.dancerFabContainer}>
          <Text style={styles.dancerFabLabel}>record your take</Text>
          <Text style={styles.dancerFabSublabel}>visible to the group</Text>
          <TouchableOpacity style={styles.recordFab} onPress={handleRecordPress}>
            <View style={styles.recordFabInner} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', backgroundColor: colors.ground },
  choreographerHeader: {
    position: 'absolute',
    top: 8,
    right: 10,
    zIndex: 2,
  },
  choreographerHeaderActions: {
    flexDirection: 'row',
    marginLeft: 'auto',
  },
  headerIconButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerIcon: {
    fontSize: 14,
    color: colors.muted,
  },
  leftPanel: { flex: 0.57, flexDirection: 'column', borderRightWidth: 0.5, borderRightColor: colors.border },
  sectionStrip: {
    height: 32,
    backgroundColor: colors.chrome,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionChip: {
    height: 20,
    paddingHorizontal: 6,
    marginRight: 4,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.ground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionChipActive: { borderColor: colors.mine, backgroundColor: colors.mineBg },
  sectionChipText: { fontSize: 8, color: colors.muted, fontWeight: '500' },
  sectionChipTextActive: { color: colors.active },
  floorCanvas: { flex: 1, backgroundColor: '#faf8f5', position: 'relative' },
  gridLine: { position: 'absolute', backgroundColor: '#ede8e0' },
  horizontalGridLine: { height: 0.5, left: 0 },
  verticalGridLine: { width: 0.5, top: 0 },
  backstageLabel: { position: 'absolute', top: 8, left: 0, right: 0, textAlign: 'center', fontSize: 7, color: colors.inactive, fontFamily: 'JetBrainsMono' },
  audienceLabel: { position: 'absolute', bottom: 8, left: 0, right: 0, textAlign: 'center', fontSize: 7, color: colors.inactive, fontFamily: 'JetBrainsMono' },
  dancerDot: { position: 'absolute', width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  dancerInitial: { color: '#fff', fontSize: 7, fontWeight: 'bold' },
  momentStrip: {
    height: 32,
    backgroundColor: colors.chrome,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  momentChip: {
    height: 20,
    paddingHorizontal: 6,
    marginRight: 4,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.ground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  momentChipActive: { borderColor: colors.mine, backgroundColor: colors.mineBg },
  momentChipText: { fontSize: 8, color: colors.muted, fontWeight: '500' },
  momentChipTextActive: { color: colors.active },
  renameInput: { fontSize: 8, color: colors.active, fontWeight: '500', textAlign: 'center', minWidth: 40 },
  rightPanel: { flex: 0.43, backgroundColor: colors.chrome, padding: 12, position: 'relative' },
  miniWaveform: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: colors.ground,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: colors.border,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  waveformBar: { width: 2, borderRadius: 1 },
  loopStatus: { fontSize: 9, color: colors.muted, marginBottom: 12, minHeight: 12 },
  roster: { flex: 1, marginBottom: 12 },
  rosterRow: {
    height: 36,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.ground,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  rosterDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  rosterName: { flex: 1, fontSize: 12, fontWeight: '700', color: colors.active },
  rosterStatus: { fontSize: 11, color: colors.muted },
  rosterRowSelected: { backgroundColor: colors.mineBg, borderColor: colors.mine },
  broadcastRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  broadcastInput: { flex: 1, fontSize: 11, color: colors.muted, padding: 8, borderWidth: 0.5, borderColor: colors.border, borderRadius: 6, backgroundColor: colors.ground },
  charCount: { fontSize: 9, color: colors.muted },
  broadcastButton: { paddingHorizontal: 8, paddingVertical: 6 },
  broadcastButtonText: { color: colors.mine, fontWeight: '700', fontSize: 11 },
  broadcastHint: { fontSize: 10, color: colors.warm, marginBottom: 66 },
  receivedNotesPanel: { maxHeight: 72, marginBottom: 72 },
  receivedNotesHeader: { fontSize: 9, color: colors.muted, marginBottom: 4, fontFamily: 'JetBrainsMono' },
  receivedNotesList: { borderWidth: 0.5, borderColor: colors.border, borderRadius: 6, backgroundColor: colors.ground },
  receivedNoteText: { fontSize: 10, color: colors.active, paddingHorizontal: 8, paddingVertical: 6, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  recordFab: { position: 'absolute', bottom: 10, right: 10, width: 64, height: 64, borderRadius: 32, backgroundColor: '#e67c5c', alignItems: 'center', justifyContent: 'center' },
  recordFabInner: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
  dancerContainer: { flex: 1, backgroundColor: colors.ground },
  dancerFloorCanvas: { height: 260, backgroundColor: '#faf8f5', position: 'relative' },
  selfDot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.mine },
  otherDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: '#fff' },
  selectedDancerDot: { borderWidth: 3, borderColor: colors.active },
  positionNoteBand: { backgroundColor: colors.mineBg, paddingVertical: 8, paddingHorizontal: 12, borderBottomWidth: 0.5, borderBottomColor: colors.border },
  positionNoteText: { fontSize: 9, color: colors.active, fontFamily: 'JetBrainsMono', textAlign: 'center' },
  dancerRightPanel: { flex: 1, padding: 12 },
  choreographerNotes: { maxHeight: 80, marginBottom: 12 },
  choreographerNotesHeader: { fontSize: 8, color: colors.muted, fontFamily: 'JetBrainsMono', marginBottom: 6 },
  newNoteSlideIn: {
    backgroundColor: colors.mineBg,
    borderLeftWidth: 2,
    borderLeftColor: colors.mine,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
    borderRadius: 4,
  },
  choreographerNoteText: { fontSize: 10, color: colors.active, borderBottomWidth: 0.5, borderBottomColor: colors.border, paddingVertical: 4 },
  clipsGridLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  clipsGridLabel: { fontSize: 11, color: colors.muted, fontFamily: 'JetBrainsMono' },
  newClipCue: { fontSize: 10, color: '#2aaea1', fontFamily: 'JetBrainsMono' },
  clipThumb: { width: 80, height: 80, borderRadius: 8, overflow: 'hidden', position: 'relative', backgroundColor: colors.ground },
  clipThumbImage: { width: '100%', height: '100%' },
  clipDancerInitialBadge: {
    position: 'absolute',
    bottom: 2,
    right: 3,
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  clipDancerInitialText: { fontSize: 7, fontWeight: '700' },
  dancerFabContainer: { position: 'absolute', bottom: 10, right: 10, alignItems: 'center' },
  dancerFabLabel: { fontSize: 9, color: colors.muted, marginBottom: 2 },
  dancerFabSublabel: { fontSize: 9, color: colors.inactive, marginBottom: 8 },
  activeMomentHint: { fontSize: 8, color: colors.inactive, marginTop: 4 },
});
