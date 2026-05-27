import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

type IconProps = {
  size?: number;
  color: string;
};

/** Stroke-based icons for session chrome (no emoji). */
export function IconInbox({ size = 22, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        d="M4 5.5h16a1.5 1.5 0 011.5 1.5v11A1.5 1.5 0 0119.5 19h-15A1.5 1.5 0 013 18V7A1.5 1.5 0 014.5 5.5z"
        stroke={color}
        strokeWidth={1.6}
        fill="none"
        strokeLinejoin="round"
      />
      <Path
        d="M4 8l8 4.5L20 8"
        stroke={color}
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconShareOut({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        d="M7 17L17 7M10 7h7v7"
        stroke={color}
        strokeWidth={1.65}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconMoreVertical({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Circle cx={12} cy={6} r={1.6} fill={color} />
      <Circle cx={12} cy={12} r={1.6} fill={color} />
      <Circle cx={12} cy={18} r={1.6} fill={color} />
    </Svg>
  );
}

export function IconPlay({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path d="M9.5 7.5v9L17 12l-7.5-4.5z" fill={color} />
    </Svg>
  );
}

export function IconPause({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path d="M8 7h3.5v10H8V7zm4.5 0H16v10h-3.5V7z" fill={color} />
    </Svg>
  );
}

export function IconSkipBack({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path d="M5 7v10" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path d="M18 7L8 12l10 5V7z" fill={color} />
    </Svg>
  );
}

export function IconSkipForward({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path d="M6 7l10 5-10 5V7z" fill={color} />
      <Path d="M19 7v10" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function IconLoop({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        d="M17 2l4 4-4 4M3 13v-1a4 4 0 014-4h14M7 22l-4-4 4-4M21 11v1a4 4 0 01-4 4H3"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

/** Settings — horizontal sliders (tool-style, reads at small sizes). */
export function IconGear({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        d="M4 8h10M4 12h16M4 16h8"
        stroke={color}
        strokeWidth={1.65}
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx={16} cy={8} r={2.2} stroke={color} strokeWidth={1.4} fill="none" />
      <Circle cx={10} cy={12} r={2.2} stroke={color} strokeWidth={1.4} fill="none" />
      <Circle cx={14} cy={16} r={2.2} stroke={color} strokeWidth={1.4} fill="none" />
    </Svg>
  );
}

/** Sun outline — “switch to day”. */
export function IconSun({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Circle cx={12} cy={12} r={3.2} stroke={color} strokeWidth={1.5} fill="none" />
      <Path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/** Moon fill — “switch to night”. */
export function IconMoon({ size = 18, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        d="M21 14.5A8.5 8.5 0 019.5 3 6.7 6.7 0 0021 14.5z"
        fill={color}
      />
    </Svg>
  );
}
