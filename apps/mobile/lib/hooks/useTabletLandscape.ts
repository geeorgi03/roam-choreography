import { useEffect, useState } from 'react';
import { Dimensions, Platform } from 'react-native';
import { theme } from '../theme';

const TABLET_MIN_WIDTH = theme.landscape.breakpoints.tablet;

export type TabletLayoutInfo = {
  /** iPad / large tablet width in landscape */
  isTabletLandscape: boolean;
  isTablet: boolean;
  isLandscape: boolean;
  width: number;
  height: number;
};

function computeLayout(window: { width: number; height: number }): TabletLayoutInfo {
  const { width, height } = window;
  const isLandscape = width > height;
  const isPad =
    Platform.OS === 'ios' &&
    typeof (Platform as { isPad?: boolean }).isPad === 'boolean' &&
    (Platform as { isPad?: boolean }).isPad === true;
  const isTablet = isPad || width >= TABLET_MIN_WIDTH;
  const isTabletLandscape = isTablet && isLandscape;
  return { isTabletLandscape, isTablet, isLandscape, width, height };
}

/** True when device is tablet-class and in landscape (split session layout). */
export function useTabletLandscape(): TabletLayoutInfo {
  const [layout, setLayout] = useState(() => computeLayout(Dimensions.get('window')));

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setLayout(computeLayout(window));
    });
    return () => sub.remove();
  }, []);

  return layout;
}
