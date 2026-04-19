---
description: Create perfect UI/UX for Roam choreography app using professional tool design principles
---

# Perfect UI/UX Workflow for Roam Choreography App

## Overview
This workflow guides Windsurf to create perfect UI/UX for the Roam choreography app, focusing on professional tool design principles that prioritize functional clarity, efficiency, and professional aesthetics over consumer app decoration.

## Design Philosophy
Roam is a **professional tool** for choreographers, not a consumer entertainment app. Every UI/UX decision should serve the functional needs of dancers and choreographers who need to capture, organize, and refine creative work efficiently.

## Core Design Principles

### 1. Functional Clarity Over Visual Flair
- **Priority**: Clear information hierarchy and readability
- **Avoid**: Decorative gradients, glass morphism, artistic effects
- **Implement**: Clean borders, structured layouts, professional colors

### 2. Professional Tool Aesthetics
- **Color Palette**: Professional blue (#0066CC) primary, neutral grays
- **Typography**: System fonts for optimal readability
- **Shadows**: Functional gray shadows, not decorative colored effects
- **Layout**: Grid-based organization with consistent spacing

### 3. Efficiency-First Interactions
- **Goal**: Minimum cognitive load, maximum productivity
- **Approach**: Predictable patterns, clear affordances, fast recognition
- **Result**: Choreographers can focus on movement, not UI navigation

## Technical Implementation Guidelines

### Theme System
Use the existing professional theme system in `apps/mobile/lib/theme.ts`:

```typescript
// Professional Tool Colors (Light)
primary: '#0066CC'     // Professional blue
secondary: '#6C757D'   // Neutral gray
ground: '#FFFFFF'      // Clean white
chrome: '#F8F9FA'      // Light gray surface
border: '#E9ECEF'      // Clear borders
active: '#212529'      // High contrast text

// Tool-Specific Colors
capture: '#E67C5C'     // Recording/creation actions
mine: '#28A745'        // Success/completion states
```

### Component Design Standards

#### Cards (ClipCard, SessionCard)
- **Size**: Compact, functional (64x64px thumbnails)
- **Borders**: Clear 1px borders, not decorative effects
- **Typography**: Standard system fonts, optimal contrast
- **Status Pills**: Clear, functional state indicators
- **Shadows**: Minimal functional shadows only

#### Navigation & Headers
- **Structure**: Clear hierarchy with borders
- **Buttons**: Professional blue, standard shadows
- **Spacing**: Consistent 4px grid system
- **Typography**: Bold headers, regular body text

#### Forms & Inputs
- **Clarity**: High contrast, clear labels
- **Validation**: Immediate, helpful feedback
- **Layout**: Structured, predictable organization
- **States**: Clear focus, error, and success states

## User Flow Optimization

### 1. Capture-First Entry
- **Goal**: Record ideas instantly, organize later
- **Implementation**: One-tap recording, zero setup friction
- **UI**: Large, obvious capture button with clear visual feedback

### 2. Session Workbench
- **Goal**: All creation tools in unified timeline
- **Implementation**: Multi-track timeline with music, clips, notes
- **UI**: Clear track separation, intuitive drag-and-drop

### 3. Voice-First Notes
- **Goal**: Pin thoughts without breaking flow
- **Implementation**: Text or voice notes at specific timecodes
- **UI**: Minimal input interface, clear timecode indicators

## Accessibility Standards

### Visual Accessibility
- **Contrast**: WCAG AA+ compliance (4.5:1 minimum)
- **Typography**: Minimum 14px body text, 12px secondary
- **Color**: Not the only indicator of state or function
- **Layout**: Clear focus indicators, logical tab order

### Motor Accessibility
- **Touch Targets**: Minimum 44px touch targets
- **Spacing**: Adequate spacing between interactive elements
- **Gestures**: Simple, standard gestures only
- **Feedback**: Clear visual and haptic feedback

## Performance Requirements

### Animation & Transitions
- **Duration**: 150-300ms for standard transitions
- **Easing**: Standard easing curves (ease-out for most)
- **Purpose**: Functional feedback, not decoration
- **Performance**: 60fps on all target devices

### Loading States
- **Skeletons**: Structured content placeholders
- **Progress**: Clear progress indicators for uploads
- **Feedback**: Immediate response to user actions
- **Graceful**: Offline functionality with cache support

## Platform-Specific Guidelines

### Mobile (React Native)
- **Navigation**: Standard platform patterns
- **Gestures**: Platform-consistent swipe/back behavior
- **Components**: Native feel with platform-specific adaptations
- **Performance**: Optimized for mobile hardware

### Web (Next.js)
- **Responsive**: Mobile-first responsive design
- **Performance**: Optimized loading and rendering
- **Accessibility**: Full keyboard navigation support
- **SEO**: Semantic HTML structure

## Quality Assurance Checklist

### Visual Design
- [ ] Professional color palette applied consistently
- [ ] High contrast text meets WCAG standards
- [ ] Typography hierarchy is clear and consistent
- [ ] Shadows are functional, not decorative
- [ ] Grid-based layout with proper alignment

### Interaction Design
- [ ] Touch targets meet minimum size requirements
- [ ] Interactive states are clearly visible
- [ ] Loading states provide clear feedback
- [ ] Error states are helpful and actionable
- [ ] Micro-interactions enhance, don't distract

### User Experience
- [ ] Information architecture is intuitive
- [ ] User flows are efficient and predictable
- [ ] Onboarding guides without overwhelming
- [ ] Feedback is immediate and informative
- [ ] Accessibility features are comprehensive

## Implementation Process

### Phase 1: Foundation
1. Audit existing components against professional standards
2. Update theme system for consistency
3. Establish component library standards
4. Implement accessibility baseline

### Phase 2: Component Refinement
1. Redesign core components (ClipCard, SessionCard, etc.)
2. Optimize navigation and header patterns
3. Implement professional status indicators
4. Add comprehensive error handling

### Phase 3: Flow Optimization
1. Streamline capture-first entry flow
2. Enhance session workbench usability
3. Improve voice notes integration
4. Optimize feedback and sharing features

### Phase 4: Polish & Testing
1. Comprehensive accessibility testing
2. Performance optimization
3. Cross-platform consistency checks
4. User acceptance testing with choreographers

## Success Metrics

### Quantitative
- **Task Completion Rate**: >95% for core workflows
- **Time to Competency**: <5 minutes for new users
- **Error Rate**: <2% for critical operations
- **Accessibility Score**: 100% WCAG AA compliance

### Qualitative
- **Professional Feel**: Users describe as "professional tool"
- **Efficiency**: Choreographers report faster workflow
- **Clarity**: Minimal confusion or need for help
- **Satisfaction**: High user satisfaction scores

## Common Pitfalls to Avoid

### Design Anti-Patterns
1. **Consumer App Decoration**: Gradients, blur effects, artistic flourishes
2. **Inconsistent Patterns**: Different styles for similar functions
3. **Poor Contrast**: Text that's hard to read
4. **Unclear States**: Ambiguous interactive elements
5. **Performance Issues**: Slow animations or loading

### Technical Anti-Patterns
1. **Hardcoded Values**: Not using design system tokens
2. **Inconsistent Spacing**: Not following 4px grid
3. **Missing Accessibility**: No keyboard navigation or screen reader support
4. **Platform Inconsistency**: Different patterns across platforms
5. **Performance Neglect**: Unoptimized images or animations

## Maintenance Guidelines

### Design System Evolution
- **Version Control**: Track design system changes
- **Documentation**: Keep guidelines up to date
- **Testing**: Regular design system audits
- **Feedback**: User feedback integration process

### Code Quality
- **Component Standards**: Consistent component structure
- **Theme Usage**: Proper theme token implementation
- **Accessibility**: Regular accessibility audits
- **Performance**: Ongoing performance monitoring

---

## Usage Instructions

To use this workflow:

1. **Review Current State**: Audit existing components against these standards
2. **Plan Changes**: Identify specific areas needing improvement
3. **Implement Changes**: Apply professional tool design principles
4. **Test Thoroughly**: Verify accessibility and performance
5. **Gather Feedback**: Test with actual choreographers
6. **Iterate**: Refine based on user feedback and metrics

## Expected Outcome

Following this workflow will result in:
- **Professional Tool Feel**: App feels like serious productivity software
- **Exceptional Usability**: Choreographers can work efficiently
- **High Accessibility**: Works for users with diverse needs
- **Platform Excellence**: Consistent experience across devices
- **User Satisfaction**: High ratings and positive feedback

The Roam app will be recognized as a **professional-grade tool** that respects choreographers' time and creative process, with the clarity, efficiency, and reliability expected in professional software.
