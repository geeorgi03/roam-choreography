import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ChoreographyThemeProvider } from '../../lib/contexts/ChoreographyThemeContext';
import { useChoreographyTheme } from '../../lib/contexts/ChoreographyThemeContext';
import { useSessionContext } from '../../lib/contexts/SessionContext';
import {
  ChoreographyTopChrome,
  type ChoreographyViewId,
} from './ChoreographyTopChrome';
import { ChoreographyWorkbenchView } from './ChoreographyWorkbenchView';
import { ChoreographyMapView } from './ChoreographyMapView';
import { ChoreographyLibraryView } from './ChoreographyLibraryView';
import { ChoreographyExploreView } from './ChoreographyExploreView';

function ShellBody() {
  const colors = useChoreographyTheme();
  const { setActiveSection, openSheet } = useSessionContext();
  const [view, setView] = useState<ChoreographyViewId>('work');

  const onJumpToWork = useCallback(
    (sectionLabel: string) => {
      setActiveSection(sectionLabel);
      setView('work');
    },
    [setActiveSection]
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.ground }]}>
      <ChoreographyTopChrome
        view={view}
        onChangeView={setView}
        onSettings={() => openSheet('share')}
      />
      {view === 'work' ? <ChoreographyWorkbenchView /> : null}
      {view === 'map' ? <ChoreographyMapView onJumpToWork={onJumpToWork} /> : null}
      {view === 'library' ? <ChoreographyLibraryView /> : null}
      {view === 'explore' ? <ChoreographyExploreView /> : null}
    </View>
  );
}

export function ChoreographyShell() {
  return (
    <ChoreographyThemeProvider>
      <ShellBody />
    </ChoreographyThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
