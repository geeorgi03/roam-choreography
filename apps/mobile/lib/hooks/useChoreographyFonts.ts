import { useFonts } from 'expo-font';
import {
  BarlowCondensed_400Regular,
  BarlowCondensed_700Bold,
  BarlowCondensed_900Black,
} from '@expo-google-fonts/barlow-condensed';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { DMMono_400Regular, DMMono_500Medium } from '@expo-google-fonts/dm-mono';

export type ChoreographyFontFamilies = {
  display: string;
  body: string;
  mono: string;
  ready: boolean;
};

const FALLBACK: ChoreographyFontFamilies = {
  display: 'System',
  body: 'System',
  mono: 'monospace',
  ready: false,
};

export function useChoreographyFonts(): ChoreographyFontFamilies {
  const [loaded] = useFonts({
    BarlowCondensed_400Regular,
    BarlowCondensed_700Bold,
    BarlowCondensed_900Black,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
    DMMono_400Regular,
    DMMono_500Medium,
  });

  if (!loaded) return FALLBACK;

  return {
    display: 'BarlowCondensed_900Black',
    body: 'DMSans_400Regular',
    mono: 'DMMono_500Medium',
    ready: true,
  };
}
