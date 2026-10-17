// Viewport-dependent layout defaults, kept pure so they are unit-testable.

// Below this width the UI switches to the phone layout (Tailwind `md`).
export const PHONE_MAX_WIDTH = 768;
// Minimum viewport height that fits the hero above the open drawer.
const DRAWER_MIN_HEIGHT = 700;

// The "Información práctica" drawer starts open only on the desktop home screen,
// where the hero is padded above it; phones always get the compact bar so the
// hero CTA is never covered.
export function defaultInfoExpanded(step, { width, height }) {
  return step === 'home' && width >= PHONE_MAX_WIDTH && height >= DRAWER_MIN_HEIGHT;
}
