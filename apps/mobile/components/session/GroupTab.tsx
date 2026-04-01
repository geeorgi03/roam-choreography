import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, FlatList, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import { theme } from '../../lib/theme';

const colors = theme.light;

function isReferenceClip(clip: {
  label?: string | null;
  move_name?: string | null;
  notes?: string | null;
}): boolean {
  const haystack = `${clip.label ?? ''} ${clip.move_name ?? ''} ${clip.notes ?? ''}`.toLowerCase();
  return haystack.includes('ref') || haystack.includes('reference');
}

interface Moment {
  id: string;
  label: string;
}

interface Dancer {
  id: string;
  name: string;
  color: string;
  online: boolean;
}

const DANCER_POSITIONS: Record<string, { top: number; left: number }> = {
  A: { top: 30, left: 20 },
  B: { top: 45, left: 40 },
  C: { top: 60, left: 60 },
  D: { top: 75, left: 80 },
};

function getDancerPosition(dancerId: string): { top: number; left: number } {
  return DANCER_POSITIONS[dancerId] ?? { top: 30, left: 20 };
}

export function GroupTab() {
  const router = useRouter();
  const {
    sessionId,
    activeSection,
    setActiveSection,
    activeMoment,
    setActiveMoment,
    clips,
    sectionClips,
    loopRegion,
    openClipSheet,
    musicTrack,
  } = useSessionContext();
  
  // Role determination
  const [isChoreographer, setIsChoreographer] = useState(true);
  
  // Shared state
  const [moments] = useState<Moment[]>([{ id: '1', label: 'moment 1' }]);
  const [renamingMomentId, setRenamingMomentId] = useState<string | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  
  // Choreographer view state
  const [broadcastText, setBroadcastText] = useState('');
  
  // Dancer view state
  const [positionNote, setPositionNote] = useState('awaiting position note from choreographer');
  const [choreographerNotes, setChoreographerNotes] = useState([
    'Focus on the opening formation',
    'Maintain eye contact with center',
  ]);
  
  // Dancers data
  const [dancers] = useState<Dancer[]>([
    { id: 'A', name: 'Alex', color: colors.mine, online: true },
    { id: 'B', name: 'Blake', color: colors.active, online: true },
    { id: 'C', name: 'Casey', color: '#e67c5c', online: false },
    { id: 'D', name: 'Drew', color: '#4a90e2', online: true },
  ]);

  // Get sections from musicTrack or use placeholders
  const sections = musicTrack?.sections || [
    { label: 'INTRO' },
    { label: 'VERSE' },
    { label: 'CHORUS' },
    { label: 'BRIDGE' },
    { label: 'OUTRO' },
  ];

  const handleMomentPress = (momentId: string) => {
    setActiveMoment(momentId);
  };

  const handleMomentLongPress = (momentId: string) => {
    setRenamingMomentId(momentId);
  };

  const handleRenameMoment = (newLabel: string) => {
    if (renamingMomentId) {
      setRenamingMomentId(null);
    }
  };

  const handleBroadcast = () => {
    setBroadcastText('');
  };

  const handleRecordPress = () => {
    router.push({
      pathname: './camera',
      params: { id: sessionId, sectionName: activeSection },
    });
  };

  const renderGridLines = () => {
    if (!canvasSize.width || !canvasSize.height) return null;
    
    const horizontalLines = [];
    const verticalLines = [];
    
    // Horizontal lines every 22dp
    for (let y = 22; y < canvasSize.height; y += 22) {
      horizontalLines.push(
        <View
          key={`h-${y}`}
          style={[
            styles.gridLine,
            styles.horizontalGridLine,
            { top: y, width: canvasSize.width }
          ]}
        />
      );
    }
    
    // Vertical lines every 22dp
    for (let x = 22; x < canvasSize.width; x += 22) {
      verticalLines.push(
        <View
          key={`v-${x}`}
          style={[
            styles.gridLine,
            styles.verticalGridLine,
            { left: x, height: canvasSize.height }
          ]}
        />
      );
    }
    
    return [...horizontalLines, ...verticalLines];
  };

  const renderWaveformBars = () => {
    const heights = [12, 24, 18, 30, 16, 28, 20, 26, 14, 22, 18, 25];
    return heights.map((height, index) => (
      <View
        key={index}
        style={[
          styles.waveformBar,
          { height, backgroundColor: colors.muted }
        ]}
      />
    ));
  };

  if (isChoreographer) {
    // Choreographer view
    return (
      <View style={styles.container}>
        {/* Dev-only toggle */}
        <TouchableOpacity
          style={styles.viewToggle}
          onPress={() => setIsChoreographer(false)}
        >
          <Text style={styles.viewToggleText}>Switch view</Text>
        </TouchableOpacity>

        {/* Left panel */}
        <View style={styles.leftPanel}>
          {/* Section strip */}
          <ScrollView 
            horizontal 
            style={styles.sectionStrip}
            showsHorizontalScrollIndicator={false}
          >
            {sections.map((section) => (
              <TouchableOpacity
                key={section.label}
                style={[
                  styles.sectionChip,
                  activeSection === section.label && styles.sectionChipActive
                ]}
                onPress={() => setActiveSection(section.label)}
              >
                <Text style={[
                  styles.sectionChipText,
                  activeSection === section.label && styles.sectionChipTextActive
                ]}>
                  {section.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Floor canvas */}
          <View 
            style={styles.floorCanvas}
            onLayout={(e) => setCanvasSize({
              width: e.nativeEvent.layout.width,
              height: e.nativeEvent.layout.height
            })}
          >
            {renderGridLines()}
            
            {/* Dancer dots */}
            {dancers.map((dancer) => {
              const position = getDancerPosition(dancer.id);
              return (
                <View
                  key={dancer.id}
                  style={[
                    styles.dancerDot,
                    {
                      backgroundColor: dancer.color,
                      top: `${position.top}%`,
                      left: `${position.left}%`,
                      opacity: dancer.online ? 1 : 0.3,
                    }
                  ]}
                >
                  <Text style={styles.dancerInitial}>{dancer.id}</Text>
                </View>
              );
            })}
            
            <Text style={styles.backstageLabel}>backstage</Text>
            <Text style={styles.audienceLabel}>audience</Text>
          </View>

          {/* Moment strip */}
          <ScrollView 
            horizontal 
            style={styles.momentStrip}
            showsHorizontalScrollIndicator={false}
          >
            {moments.map((moment) => (
              <TouchableOpacity
                key={moment.id}
                style={[
                  styles.momentChip,
                  activeMoment === moment.id && styles.momentChipActive
                ]}
                onPress={() => handleMomentPress(moment.id)}
                onLongPress={() => handleMomentLongPress(moment.id)}
              >
                {renamingMomentId === moment.id ? (
                  <TextInput
                    style={styles.renameInput}
                    defaultValue={moment.label}
                    onBlur={(e) => handleRenameMoment(e.nativeEvent.text)}
                    onSubmitEditing={(e) => handleRenameMoment(e.nativeEvent.text)}
                    autoFocus
                  />
                ) : (
                  <Text style={[
                    styles.momentChipText,
                    activeMoment === moment.id && styles.momentChipTextActive
                  ]}>
                    {moment.label}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Right panel */}
        <View style={styles.rightPanel}>
          {/* Mini waveform */}
          <View style={styles.miniWaveform}>
            {renderWaveformBars()}
          </View>

          {/* Loop status */}
          <Text style={styles.loopStatus}>
            {loopRegion ? 'loop 1 active' : ''}
          </Text>

          {/* Dancer roster */}
          <ScrollView showsVerticalScrollIndicator={false} style={styles.roster}>
            {dancers.map((dancer) => (
              <View key={dancer.id} style={styles.rosterRow}>
                <View style={[
                  styles.rosterDot,
                  { backgroundColor: dancer.color, opacity: dancer.online ? 1 : 0.3 }
                ]} />
                <Text style={styles.rosterName}>{dancer.name}</Text>
                <Text style={styles.rosterStatus}>
                  {dancer.online ? '● active' : 'offline'}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Broadcast input */}
          <View style={styles.broadcastRow}>
            <TextInput
              style={styles.broadcastInput}
              value={broadcastText}
              onChangeText={setBroadcastText}
              placeholder="send note to all dancers…"
              placeholderTextColor={colors.muted}
              maxLength={60}
            />
            {broadcastText.length > 0 && (
              <Text style={styles.charCount}>{broadcastText.length}/60</Text>
            )}
            <TouchableOpacity
              style={styles.broadcastButton}
              onPress={handleBroadcast}
            >
              <Text style={styles.broadcastButtonText}>→ all</Text>
            </TouchableOpacity>
          </View>

          {/* Record FAB */}
          <TouchableOpacity
            style={styles.recordFab}
            onPress={handleRecordPress}
          >
            <View style={styles.recordFabInner} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Dancer view
  return (
    <View style={styles.dancerContainer}>
      {/* Floor canvas */}
      <View 
        style={styles.dancerFloorCanvas}
        onLayout={(e) => setCanvasSize({
          width: e.nativeEvent.layout.width,
          height: e.nativeEvent.layout.height
        })}
      >
        {renderGridLines()}
        
        {/* Dancer dots */}
        {dancers.map((dancer) => {
          const isSelf = dancer.id === 'A'; // Assume first dancer is self
          const position = getDancerPosition(dancer.id);
          return (
            <View
              key={dancer.id}
              style={[
                styles.dancerDot,
                isSelf ? styles.selfDot : styles.otherDot,
                {
                  backgroundColor: dancer.color,
                  top: `${position.top}%`,
                  left: `${position.left}%`,
                }
              ]}
            >
              <Text style={styles.dancerInitial}>{dancer.id}</Text>
            </View>
          );
        })}
        
        <Text style={styles.backstageLabel}>backstage</Text>
        <Text style={styles.audienceLabel}>audience</Text>
      </View>

      {/* Position note band */}
      <View style={styles.positionNoteBand}>
        <Text style={styles.positionNoteText}>{positionNote}</Text>
      </View>

      {/* Right panel */}
      <View style={styles.dancerRightPanel}>
        {/* Choreographer notes */}
        <View style={styles.choreographerNotes}>
          <Text style={styles.choreographerNotesHeader}>CHOREOGRAPHER NOTES</Text>
          <ScrollView showsVerticalScrollIndicator={false}>
            {choreographerNotes.map((note, index) => (
              <Text key={index} style={styles.choreographerNoteText}>
                {note}
              </Text>
            ))}
          </ScrollView>
        </View>

        {/* Clips grid */}
        <Text style={styles.clipsGridLabel}>ALL TAKES</Text>
        <FlatList
          data={clips}
          keyExtractor={(clip) => clip.local_id}
          numColumns={2}
          columnWrapperStyle={{ gap: 8 }}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.clipThumb,
                isReferenceClip(item) ? styles.clipThumbRef : styles.clipThumbMine,
              ]}
              onPress={() => openClipSheet(item)}
              activeOpacity={0.85}
            >
              {item.mux_playback_id ? (
                <Image
                  source={{
                    uri: `https://image.mux.com/${item.mux_playback_id}/thumbnail.jpg?time=0`,
                  }}
                  style={styles.clipThumbImage}
                />
              ) : null}
              <View
                style={[
                  styles.clipTypeBadge,
                  isReferenceClip(item) ? styles.clipTypeBadgeRef : styles.clipTypeBadgeMine,
                ]}
              >
                <Text
                  style={[
                    styles.clipTypeBadgeText,
                    isReferenceClip(item)
                      ? styles.clipTypeBadgeTextRef
                      : styles.clipTypeBadgeTextMine,
                  ]}
                >
                  {isReferenceClip(item) ? 'REF' : 'MINE'}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* Record FAB */}
        <View style={styles.dancerFabContainer}>
          <Text style={styles.dancerFabLabel}>record your take</Text>
          <Text style={styles.dancerFabSublabel}>visible to the group</Text>
          <TouchableOpacity
            style={styles.recordFab}
            onPress={handleRecordPress}
          >
            <View style={styles.recordFabInner} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.ground,
  },
  viewToggle: {
    position: 'absolute',
    top: 4,
    right: 4,
    zIndex: 100,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.chrome,
    borderRadius: 4,
  },
  viewToggleText: {
    fontSize: 8,
    color: colors.muted,
  },
  leftPanel: {
    flex: 0.57,
    flexDirection: 'column',
    borderRightWidth: 0.5,
    borderRightColor: colors.border,
  },
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
  sectionChipActive: {
    borderColor: colors.mine,
    backgroundColor: colors.mineBg,
  },
  sectionChipText: {
    fontSize: 8,
    color: colors.muted,
    fontWeight: '500',
  },
  sectionChipTextActive: {
    color: colors.active,
  },
  floorCanvas: {
    flex: 1,
    backgroundColor: '#faf8f5',
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#ede8e0',
  },
  horizontalGridLine: {
    height: 0.5,
    left: 0,
  },
  verticalGridLine: {
    width: 0.5,
    top: 0,
  },
  backstageLabel: {
    position: 'absolute',
    top: 8,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 7,
    color: colors.inactive,
    fontFamily: 'JetBrainsMono',
  },
  audienceLabel: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 7,
    color: colors.inactive,
    fontFamily: 'JetBrainsMono',
  },
  dancerDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dancerInitial: {
    color: '#fff',
    fontSize: 7,
    fontWeight: 'bold',
  },
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
  momentChipActive: {
    borderColor: colors.mine,
    backgroundColor: colors.mineBg,
  },
  momentChipText: {
    fontSize: 8,
    color: colors.muted,
    fontWeight: '500',
  },
  momentChipTextActive: {
    color: colors.active,
  },
  renameInput: {
    fontSize: 8,
    color: colors.active,
    fontWeight: '500',
    textAlign: 'center',
    minWidth: 40,
  },
  rightPanel: {
    flex: 0.43,
    backgroundColor: colors.chrome,
    padding: 12,
    position: 'relative',
  },
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
  waveformBar: {
    width: 2,
    borderRadius: 1,
  },
  loopStatus: {
    fontSize: 9,
    color: colors.muted,
    marginBottom: 12,
    minHeight: 12,
  },
  roster: {
    flex: 1,
    marginBottom: 12,
  },
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
  rosterDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  rosterName: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    color: colors.active,
  },
  rosterStatus: {
    fontSize: 11,
    color: colors.muted,
  },
  broadcastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 80, // Space for FAB
  },
  broadcastInput: {
    flex: 1,
    fontSize: 11,
    color: colors.muted,
    padding: 8,
    borderWidth: 0.5,
    borderColor: colors.border,
    borderRadius: 6,
    backgroundColor: colors.ground,
  },
  charCount: {
    fontSize: 9,
    color: colors.muted,
  },
  broadcastButton: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  broadcastButtonText: {
    color: colors.mine,
    fontWeight: '700',
    fontSize: 11,
  },
  recordFab: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#e67c5c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordFabInner: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#fff',
  },
  // Dancer view styles
  dancerContainer: {
    flex: 1,
    backgroundColor: colors.ground,
  },
  dancerFloorCanvas: {
    height: 260,
    backgroundColor: '#faf8f5',
    position: 'relative',
  },
  selfDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.mine,
  },
  otherDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  positionNoteBand: {
    backgroundColor: colors.mineBg,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  positionNoteText: {
    fontSize: 9,
    color: colors.active,
    fontFamily: 'JetBrainsMono',
    textAlign: 'center',
  },
  dancerRightPanel: {
    flex: 1,
    padding: 12,
  },
  choreographerNotes: {
    maxHeight: 80,
    marginBottom: 12,
  },
  choreographerNotesHeader: {
    fontSize: 8,
    color: colors.muted,
    fontFamily: 'JetBrainsMono',
    marginBottom: 6,
  },
  choreographerNoteText: {
    fontSize: 10,
    color: colors.active,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    paddingVertical: 4,
  },
  clipsGridLabel: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: 'JetBrainsMono',
    marginBottom: 8,
  },
  clipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 100, // Space for FAB
  },
  clipThumb: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  clipThumbRef: {
    backgroundColor: colors.warm,
  },
  clipThumbMine: {
    backgroundColor: colors.mine,
  },
  clipThumbImage: {
    width: '100%',
    height: '100%',
  },
  clipTypeBadge: {
    position: 'absolute',
    top: 4,
    left: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  clipTypeBadgeRef: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  clipTypeBadgeMine: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  clipTypeBadgeText: {
    fontSize: 8,
    fontWeight: '700',
  },
  clipTypeBadgeTextRef: {
    color: colors.warm,
  },
  clipTypeBadgeTextMine: {
    color: colors.mine,
  },
  clipInitial: {
    position: 'absolute',
    bottom: 2,
    right: 3,
    fontSize: 7,
    fontWeight: 'bold',
  },
  dancerFabContainer: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    alignItems: 'center',
  },
  dancerFabLabel: {
    fontSize: 9,
    color: colors.muted,
    marginBottom: 2,
  },
  dancerFabSublabel: {
    fontSize: 9,
    color: colors.inactive,
    marginBottom: 8,
  },
});
