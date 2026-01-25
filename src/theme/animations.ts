// Animation utilities for consistent micro-interactions

export const animations = {
  // Timing constants
  timing: {
    fast: 150,
    normal: 250,
    slow: 350,
  },

  // Easing curves
  easing: {
    easeOut: 'ease-out',
    easeIn: 'ease-in',
    easeInOut: 'ease-in-out',
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Common transform values
  scale: {
    press: 0.96,
    hover: 1.02,
    default: 1,
  },

  // Opacity values
  opacity: {
    hidden: 0,
    disabled: 0.5,
    subtle: 0.7,
    visible: 1,
  },
} as const;

// Helper for creating consistent press animations
export const createPressStyle = (pressed: boolean) => ({
  transform: [{ scale: pressed ? animations.scale.press : animations.scale.default }],
  opacity: pressed ? animations.opacity.subtle : animations.opacity.visible,
});

export type Animations = typeof animations;
