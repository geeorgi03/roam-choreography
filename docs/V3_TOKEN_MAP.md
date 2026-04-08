## 1. Token Reference — `theme.light`

| Token | Hex / Value | Semantic Role |
|---|---|---|
| `ground` | `#F9F7F4` | Page / screen background |
| `chrome` | `#FFFFFF` | Panel surfaces, bottom bars, cards |
| `border` | `#E8E3DC` | All dividers, pill borders, input outlines |
| `inactive` | `#B8B0A5` | Inactive labels, empty-state text, disabled icons |
| `muted` | `#8A8278` | Secondary metadata, timestamps, placeholder text |
| `active` | `#3A342D` | Primary text, active icons, playhead |
| `warm` | `#D4A574` | REF clip badge tint (alias of `ref`) |
| `amber` | `#E8A87C` | Feeling strip accent, loop-open state, trim handles |
| `amberBg` | `rgba(232,168,124,0.08)` | Feeling strip container background |
| `capture` | `#E67C5C` | Record FAB only — no other use |
| `mine` | `#7DB9A8` | MINE clip badge, active loop, teal accents, active section |
| `mineBg` | `rgba(125,185,168,0.12)` | Active section pill background, loop chip background |
| `ref` | `#D4A574` | REF clip tint (canonical; `warm` is an alias) |

| Token | Value | Usage |
|---|---|---|
| `displayFamily` | `Fraunces` | Session name, feeling phrase, italic notes |
| `monoFamily` | `JetBrainsMono` | All labels, buttons, metadata, timestamps |
| `bodyFamily` | `System` | Not used in any V3 screen |
| `sizes.xs` | `10` | Smallest labels |
| `sizes.sm` | `12` | Secondary labels |
| `sizes.md` | `14` | Body / form text |
| `sizes.lg` | `16` | Primary body |
| `sizes.xl` | `20` | Sub-headings |
| `sizes.xxl` | `36` | Brand title (auth screens) |

| Token | dp | Usage |
|---|---|---|
| `xxs` | 4 | Tight gaps |
| `xs` | 8 | Standard gap |
| `sm` | 12 | Inner padding |
| `md` | 16 | Section padding |
| `lg` | 20 | — |
| `xl` | 24 | Content padding |
| `xxl` | 32 | Large gaps |
| `radiusSm` | 8 | Small radius |
| `radiusMd` | 12 | Card / input radius |
| `radiusLg` | 14 | — |
| `pill` | 999 | Full pill radius |

## 2. Component-Level Token Usage Map

### 2.1 `FeelingStrip` (`components/session/FeelingStrip.tsx`)

| Role | Token(s) | Notes |
|---|---|---|
| Container background | `amberBg` | Warm amber wash |
| Container border | `border` | 0.5 pt bottom |
| Session name text | `active` | Fraunces 22 pt |
| Phrase text | `muted` | Fraunces italic 16 pt |
| Placeholder text | `muted` | Both name and phrase inputs |
| Icon text | `muted` | Bell / share / overflow |
| Inbox badge background | `capture` | Notification dot |
| Inbox badge text | `#FFFFFF` (hardcoded) | White on capture |

### 2.2 `SessionTabBar` (`components/session/SessionTabBar.tsx`)

| Role | Token(s) | Notes |
|---|---|---|
| Container background | `chrome` | 36 dp height |
| Container border | `border` | 0.5 pt bottom |
| Inactive tab text | `muted` | 12 pt, weight 400 |
| Active tab text | `active` | 12 pt, weight 700 |
| Active tab underline | `active` | 2 pt bottom border |

### 2.3 `TransportBar` (`components/session/TransportBar.tsx`)

| Role | Token(s) | Notes |
|---|---|---|
| Container background | `chrome` (`#FFFFFF` hardcoded) | 52 dp height |
| Container border | `border` (`#E8E3DC` hardcoded) | 0.5 pt top |
| Play button background | `active` (`#3A342D` hardcoded) | 36 dp circle |
| Play button icon | `#FFFFFF` (hardcoded) | — |
| Seek button border | `border` (via `theme.light.border`) | — |
| Seek button background | `chrome` (via `theme.light.chrome`) | — |
| Seek icon text | `muted` (via `theme.light.muted`) | — |
| Speed label | `muted` (`#8A8278` hardcoded) | JetBrainsMono 9 pt |
| Speed button border | `border` (`#E8E3DC` hardcoded) | — |
| Active speed button bg | `active` (`#3A342D` hardcoded) | — |
| Loop button (open state) bg | `#fff8ee` (hardcoded) | Amber tint |
| Loop button (open state) border | `#E8A87C` (hardcoded) | = `amber` |
| Loop button (closed state) bg | `#e1f5ee` (hardcoded) | Mine tint |
| Loop button (closed state) border | `#7DB9A8` (hardcoded) | = `mine` |
| Loop dot (open) | `#E8A87C` (hardcoded) | = `amber` |
| Loop dot (closed) | `#7DB9A8` (hardcoded) | = `mine` |
| Loop label (open) | `#7a5c2e` (hardcoded) | Warm brown |
| Loop label (closed) | `#085041` (hardcoded) | Deep teal |

> ⚠️ **Note:** `TransportBar` has the most hardcoded values in the codebase. All `#3A342D`, `#E8E3DC`, `#8A8278`, `#E8A87C`, `#7DB9A8` occurrences should be replaced with their canonical token equivalents in a future cleanup pass.

### 2.4 `WorkbenchTab` (`components/session/WorkbenchTab.tsx`)

| Role | Token(s) | Notes |
|---|---|---|
| Screen background | `ground` | — |
| Add-music prompt bg | `chrome` | — |
| Add-music prompt border | `border` | — |
| Add-music prompt text | `muted` | JetBrainsMono 11 pt |
| Waveform bar (inactive) | `border` (`#E8E3DC` hardcoded) | — |
| Waveform bar (loop active) | `rgba(125,185,168,0.6)` (hardcoded) | ≈ `mine` at 60% |
| Waveform loop edge | `mine` (`#7DB9A8` hardcoded) | — |
| Waveform playhead | `active` (`#3A342D` hardcoded) | — |
| Toggle chip (active) bg | `active` | — |
| Toggle chip (active) border | `active` | — |
| Toggle chip (inactive) border | `border` | — |
| Toggle chip text (inactive) | `muted` | — |
| Section pill (inactive) border | `border` | — |
| Section pill (active) border | `mine` (`#7DB9A8` hardcoded) | — |
| Section pill (active) bg | `mineBg` (`rgba(125,185,168,0.12)` hardcoded) | — |
| Section pill text (inactive) | `inactive` (`#B8B0A5` hardcoded) | — |
| Section pill text (active) | `active` (`#3A342D` hardcoded) | — |
| Workspace title | `active` | — |
| Workspace meta | `muted` | — |
| Map jump button bg | `chrome` | — |
| Map jump button border | `border` | — |
| Map jump button text | `muted` | — |
| Workspace tab (inactive) bg | `chrome` | — |
| Workspace tab (inactive) border | `border` | — |
| Workspace tab (active) bg | `active` | — |
| Workspace tab text (inactive) | `muted` | — |
| REF clip thumb bg | `warm` | — |
| MINE clip thumb bg | `mine` | — |
| Voice memo clip thumb bg | `capture` | — |
| REF badge text | `warm` | — |
| MINE badge text | `mine` | — |
| Voice memo badge text | `capture` | — |
| Note item border | `border` | — |
| Note active playback border | `mine` | Left 2 pt |
| Note time text | `muted` | — |
| Note body text | `active` | — |
| Record FAB bg | `capture` | 64 dp circle |
| Empty state text | `muted` | — |
| Empty video button bg | `active` | — |
| Empty record button bg | `capture` | — |

### 2.5 `ClipViewerSheet` (`components/session/ClipViewerSheet.tsx`)

| Zone | Role | Token(s) | Notes |
|---|---|---|---|
| Dark zone | Background | `night.ground` (`#0D0D0C`) | Top half of sheet |
| Dark zone | Clip label text | `#FFFFFF` (hardcoded) | — |
| Dark zone | Mirror pill bg | `rgba(255,255,255,0.2)` (hardcoded) | — |
| Dark zone | Progress bar bg | `rgba(255,255,255,0.2)` (hardcoded) | — |
| Dark zone | Progress fill | `mine` (`#7DB9A8` hardcoded) | — |
| Dark zone | Skip button bg | `rgba(255,255,255,0.2)` (hardcoded) | — |
| Dark zone | Speed button bg | `rgba(255,255,255,0.2)` (hardcoded) | — |
| Light zone | Background | `ground` | Bottom half |
| Light zone | Lineage border | `border` (`#E8E3DC` hardcoded) | — |
| Light zone | Parent clip text | `muted` | — |
| Light zone | Loop chip bg | `mineBg` | — |
| Light zone | Loop chip border | `mine` | — |
| Light zone | Loop chip text | `mine` | — |
| Light zone | Save button bg | `mine` (`#7DB9A8` hardcoded) | — |
| Light zone | Save button disabled bg | `chrome` | — |
| Light zone | Moment button border | `amber` | — |
| Light zone | Moment button text | `amber` | — |
| Light zone | Trim handle bg | `amber` | — |
| Light zone | Trim region bg | `amber` at 25% opacity | — |
| Light zone | Set trim button border | `amber` | — |
| Light zone | Save segment button bg | `amber` | — |

### 2.6 `SongMapTab` (`components/session/SongMapTab.tsx`)

| Role | Token(s) | Notes |
|---|---|---|
| Screen background | `ground` | — |
| Top bar background | `chrome` | — |
| Top bar border | `border` | — |
| Session name text | `active` | Fraunces 18 pt |
| Section label text | `muted` | JetBrainsMono 10 pt |
| Moment strip bg | `chrome` | — |
| Moment strip border | `border` | — |
| Moment chip (inactive) border | `border` | — |
| Moment chip (inactive) bg | `ground` | — |
| Moment chip (active) border | `mine` | — |
| Moment chip (active) bg | `mineBg` | — |
| Moment chip text (inactive) | `muted` | — |
| Moment chip text (active) | `active` | — |
| Floor canvas bg | `#faf8f5` (hardcoded) | Near-ground off-white |
| Grid lines | `#ede8e0` (hardcoded) | Near-border |
| Backstage / audience labels | `inactive` | JetBrainsMono 7 pt |
| Section panel bg | `chrome` | — |
| Section panel border | `border` | — |
| Section header text | `muted` | JetBrainsMono 8 pt |
| Toggle button (active) bg | `active` | — |
| Toggle button (inactive) bg | `ground` | — |
| Toggle button text (inactive) | `muted` | — |
| Section row (inactive) bg | `ground` | — |
| Section row (active) border | `mine` (`#7DB9A8` hardcoded) | — |
| Section row (active) bg | `mineBg` (`rgba(125,185,168,0.12)` hardcoded) | — |
| Section row text | `active` | — |
| Section count text | `muted` | — |

### 2.7 `SpatialTab` (`components/session/SpatialTab.tsx`)

| Role | Token(s) | Notes |
|---|---|---|
| Screen background | `ground` | — |
| Moment strip bg | `chrome` | — |
| Moment strip border | `border` | — |
| Moment chip (inactive) border | `border` | — |
| Moment chip (active) border | `mine` | — |
| Moment chip (active) bg | `mineBg` | — |
| Moment chip text (inactive) | `muted` | — |
| Moment chip text (active) | `active` | — |
| Floor canvas bg | `#faf8f5` (hardcoded) | — |
| Grid lines | `#ede8e0` (hardcoded) | — |
| Backstage / audience labels | `inactive` | — |
| Dancer dot border | `#FFFFFF` (hardcoded) | — |
| Dancer dot selected border | `active` | — |
| Dancer initial text | `#FFFFFF` (hardcoded) | — |
| Tool button (inactive) bg | `ground` | — |
| Tool button (inactive) border | `border` | — |
| Tool button (active) bg | `active` | — |
| Tool button text (inactive) | `muted` | — |
| Right panel bg | `chrome` | — |
| Right panel border | `border` | — |
| Group chip border | `mine` | — |
| Group chip text | `mine` | JetBrainsMono |
| Mini waveform bg | `ground` | — |
| Mini waveform border | `border` | — |
| Quality field label | `muted` | JetBrainsMono 8 pt |
| Quality field input bg | `ground` | — |
| Quality field input border | `border` | — |
| Note field filled border | `mine` | Left 2.5 pt |
| Note input font | Fraunces italic | — |
| Reference field bg | `ground` | — |
| Reference field border | `border` | — |

### 2.8 `GroupTab` (`components/session/GroupTab.tsx`)

| Role | Token(s) | Notes |
|---|---|---|
| Screen background | `ground` | — |
| Left panel border | `border` | — |
| Section strip bg | `chrome` | — |
| Section strip border | `border` | — |
| Section chip (inactive) border | `border` | — |
| Section chip (active) border | `mine` | — |
| Section chip (active) bg | `mineBg` | — |
| Section chip text (inactive) | `muted` | — |
| Section chip text (active) | `active` | — |
| Floor canvas bg | `#faf8f5` (hardcoded) | — |
| Grid lines | `#ede8e0` (hardcoded) | — |
| Backstage / audience labels | `inactive` | — |
| Dancer dot border | `#FFFFFF` (hardcoded) | — |
| Self dot border | `mine` | — |
| Selected dancer border | `active` | — |
| Moment strip bg | `chrome` | — |
| Moment strip border | `border` | — |
| Moment chip (active) border | `mine` | — |
| Moment chip (active) bg | `mineBg` | — |
| Right panel bg | `chrome` | — |
| Mini waveform bg | `ground` | — |
| Mini waveform border | `border` | — |
| Roster row bg | `ground` | — |
| Roster row border | `border` | — |
| Roster row (selected) bg | `mineBg` | — |
| Roster row (selected) border | `mine` | — |
| Roster name text | `active` | — |
| Roster status text | `muted` | — |
| Broadcast input bg | `ground` | — |
| Broadcast input border | `border` | — |
| Broadcast input text | `muted` | — |
| Broadcast button text | `mine` | — |
| Broadcast hint text | `warm` | — |
| Share error text | `warm` | — |
| Position note band bg | `mineBg` | — |
| Position note band border | `border` | — |
| Position note text | `active` | JetBrainsMono |
| New note slide-in bg | `mineBg` | — |
| New note slide-in border | `mine` | Left 2 pt |
| Choreographer note text | `active` | — |
| Clip thumb bg | `ground` | — |
| Record FAB bg | `#E67C5C` (hardcoded) | = `capture` |
| New clip cue text | `#2aaea1` (hardcoded) | Near-`mine` |

### 2.9 Camera (`app/(app)/session/camera.tsx`)

| Role | Token(s) | Notes |
|---|---|---|
| Screen background | `ground` | — |
| Top bar background | `ground` | — |
| Session label text | `active` | — |
| Section label text | `muted` | — |
| Back button text | `active` | — |
| Dual-screen chip border (inactive) | `inactive` | — |
| Dual-screen chip border (active) | `mine` | — |
| Dual-screen chip bg (active) | `mineBg` | — |
| Dual-screen chip text (inactive) | `inactive` | — |
| Dual-screen chip text (active) | `mine` | — |
| Beta badge bg | `mineBg` | — |
| Beta badge text | `mine` | — |
| PiP container border | `mine` | — |
| Control button bg | `chrome` | — |
| Control button border | `border` | — |
| Control button icon | `active` | — |
| Control button icon (disabled) | `inactive` | — |
| Record button bg | `capture` | 72 dp circle |
| Record button ring | `rgba(255,255,255,0.5)` (hardcoded) | — |
| Record button icon | `chrome` | White circle / square |
| Primary button bg | `capture` | Save button |
| Primary button text | `chrome` | — |
| Outline button border | `border` | Retake button |
| Outline button text | `active` | — |
| Fallback notice bg | `rgba(58,52,45,0.82)` (hardcoded) | Dark overlay |
| Fallback notice border | `border` | — |
| Fallback notice text | `inactive` | — |
| Voice memo dot | `capture` | — |
| Voice memo label | `chrome` | — |
| Placeholder text | `muted` | Permission screen |

### 2.10 Library (`app/(app)/library.tsx`)

| Role | Token(s) | Notes |
|---|---|---|
| Screen background | `ground` | — |
| Search bar bg | `chrome` | — |
| Search bar border | `border` | — |
| Search input text | `active` | — |
| Search placeholder | `muted` | — |
| Segment control border | `border` | — |
| Segment (inactive) bg | `chrome` | — |
| Segment (active) bg | `mine` | — |
| Segment text (inactive) | `muted` | — |
| Segment text (active) | `active` | — |
| Activity indicator | `active` | — |
| Empty state bg | `amberBg` | Warm amber wash |
| Empty state title | `active` | Fraunces 20 pt |
| Empty CTA bg | `mine` | — |
| Empty CTA text | `chrome` | — |
| Load more button bg | `chrome` | — |
| Load more button border | `border` | — |
| Load more text | `active` | — |

### 2.11 Auth — Sign In (`app/auth/sign-in.tsx`)

| Role | Token(s) | Notes |
|---|---|---|
| Screen background | `light.ground` | — |
| Brand title text | `light.active` | 36 pt, weight 700 |
| Tagline text | `light.muted` | 14 pt |
| Form card bg | `light.chrome` | — |
| Form card border | `light.border` | Uses `theme.borderRadius` (12) |
| Label text | `light.active` | — |
| Input bg | `light.ground` | — |
| Input border | `light.border` | — |
| Input text | `light.active` | — |
| Input placeholder | `light.muted` | — |
| Error text | `light.amber` | — |
| Sign-in button bg | `light.mine` | — |
| Sign-in button text | `light.ground` | — |
| Link text | `light.muted` | — |
| Dev bypass link text | `light.mine` | DEV only |
| Loading spinner | `light.active` | — |

### 2.12 Auth — Sign Up (`app/auth/sign-up.tsx`)

Identical token usage to Sign In. Additional:

| Role | Token(s) | Notes |
|---|---|---|
| Success message text | `light.muted` | "Check your email" |

### 2.13 Web Share Page (`apps/web/app/s/[token]/page.tsx`)

| Role | Token/class mapping | Notes |
|---|---|---|
| Page background | `bg-roam-ground` | Root page surface |
| Primary text baseline | `text-roam-active` | Applied at page root; inherited by headings/body text |
| Header border | `border-roam-border` | Header bottom divider |
| Header metadata text | `text-roam-muted` | Date text under session title |
| Section chips / section placeholders bg | `bg-roam-chrome` | Section tags and placeholder cards |
| Section chips / section placeholders border | `border-roam-border` | Tokenized outlines for chips and placeholder cards |
| Section chips text | `text-roam-active` | Section labels and timestamps |
| Processing / empty surfaces text | `text-roam-muted` | "Music processing…", "No music added", clip "Processing…" text |
| Footer text | `text-roam-muted` | "Made with Roam" footer |

## 3. Night Mode Delta

Night mode keeps all accent tokens identical to light mode. Only the neutral surface tokens differ.

| Token | Light | Night | Delta |
|---|---|---|---|
| `ground` | `#F9F7F4` | `#0D0D0C` | ✅ differs |
| `chrome` | `#FFFFFF` | `#1A1A18` | ✅ differs |
| `border` | `#E8E3DC` | `#2A2825` | ✅ differs |
| `inactive` | `#B8B0A5` | `#4A4845` | ✅ differs |
| `muted` | `#8A8278` | `#6A6560` | ✅ differs |
| `active` | `#3A342D` | `#E8E4DC` | ✅ differs (inverted) |
| `warm` | `#D4A574` | `#D4A574` | — same |
| `amber` | `#E8A87C` | `#E8A87C` | — same |
| `amberBg` | `rgba(232,168,124,0.08)` | `rgba(232,168,124,0.08)` | — same |
| `capture` | `#E67C5C` | `#E67C5C` | — same |
| `mine` | `#7DB9A8` | `#7DB9A8` | — same |
| `mineBg` | `rgba(125,185,168,0.12)` | `rgba(125,185,168,0.12)` | — same |
| `ref` | `#D4A574` | `#D4A574` | — same |

**Summary:** 6 tokens differ (all neutral surfaces + text). 7 tokens are identical (all accent/semantic colors). Night mode is currently defined but not wired to `useColorScheme` — all components use `theme.light` directly.

## 4. Deprecated Aliases

The following flat-contract aliases exist on the root `theme` object for backward compatibility with pre-V3 consumers. They should not be used in new code.

| Alias | Value | Canonical Replacement | Status |
|---|---|---|---|
| `theme.background` | `#F9F7F4` | `theme.light.ground` | ⚠️ Deprecated |
| `theme.textPrimary` | `#3A342D` | `theme.light.active` | ⚠️ Deprecated |
| `theme.textSecondary` | `#8A8278` | `theme.light.muted` | ⚠️ Deprecated |
| `theme.accent` | `#7DB9A8` | `theme.light.mine` | ⚠️ Deprecated |
| `theme.borderRadius` | `12` | `theme.spacing.radiusMd` | ⚠️ Deprecated |

> These aliases are used in `sign-in.tsx` and `sign-up.tsx` (`theme.borderRadius`). All other files use `theme.light.*` directly. A future cleanup pass should replace all alias usages and remove the flat-contract keys from `theme.ts`.

Also note the `warm` / `ref` duplication: both `theme.light.warm` and `theme.light.ref` resolve to `#D4A574`. `ref` is canonical; `warm` is a semantic alias kept for readability in REF-clip contexts.
