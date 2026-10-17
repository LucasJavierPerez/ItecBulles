import { describe, it, expect } from 'vitest';
import { CAROUSEL, createCarousel, layoutFor, wrapRelative } from '../app/scene/carousel.js';

const settle = (c, seconds = 5) => {
  for (let i = 0; i < seconds * 60; i += 1) c.update(1 / 60);
};

describe('carousel', () => {
  it('uses the Projet Bulles constants', () => {
    expect(CAROUSEL.friction).toBe(0.92);
    expect(CAROUSEL.maxSpeed).toBe(0.4);
    expect(CAROUSEL.arcDepth).toBe(0.09);
    expect(CAROUSEL.arcRotation).toBe(0.15);
  });

  it('wraps a relative index into [-n/2, n/2)', () => {
    expect(wrapRelative(0, 11)).toBe(0);
    expect(wrapRelative(6, 11)).toBe(-5);
    expect(wrapRelative(-6, 11)).toBe(5);
    expect(wrapRelative(10.5, 11)).toBeCloseTo(-0.5);
  });

  it('starts at rest focused on the first item', () => {
    const c = createCarousel({ count: 11 });
    expect(c.offset).toBe(0);
    expect(c.velocity).toBe(0);
    expect(c.focusedIndex()).toBe(0);
  });

  it('places items along x by spacing, wrapping around', () => {
    const c = createCarousel({ count: 11, spacing: 2 });
    expect(c.itemTransform(0).x).toBe(0);
    expect(c.itemTransform(1).x).toBe(2);
    expect(c.itemTransform(10).x).toBe(-2);
  });

  it('bends items away at the edges with the arc curves', () => {
    const c = createCarousel({ count: 11, spacing: 2 });
    const t = c.itemTransform(1);
    expect(t.z).toBeCloseTo(-0.09 * 4);
    expect(t.rotationY).toBeCloseTo(-0.15 * 2);
    expect(c.itemTransform(0).z).toBeCloseTo(0);
    expect(c.itemTransform(10).z).toBeCloseTo(t.z);
  });

  it('caps added velocity at max speed', () => {
    const c = createCarousel({ count: 11 });
    c.addVelocity(5);
    expect(c.velocity).toBe(0.4);
    c.addVelocity(-50);
    expect(c.velocity).toBe(-0.4);
  });

  it('applies friction .92 per 60 fps frame', () => {
    const c = createCarousel({ count: 11, snap: false });
    c.addVelocity(0.2);
    c.update(1 / 60);
    expect(c.offset).toBeCloseTo(0.2);
    expect(c.velocity).toBeCloseTo(0.2 * 0.92);
  });

  it('is frame-rate independent', () => {
    const a = createCarousel({ count: 11, snap: false });
    const b = createCarousel({ count: 11, snap: false });
    a.addVelocity(0.3);
    b.addVelocity(0.3);
    a.update(1 / 30);
    b.update(1 / 60);
    b.update(1 / 60);
    expect(a.offset).toBeCloseTo(b.offset, 10);
    expect(a.velocity).toBeCloseTo(b.velocity, 10);
  });

  it('wheel scrolling down moves towards the next items', () => {
    const c = createCarousel({ count: 11 });
    c.wheel(100);
    expect(c.velocity).toBeGreaterThan(0);
  });

  it('dragging right adds negative velocity (content follows the pointer)', () => {
    const c = createCarousel({ count: 11 });
    c.pointerDown(100);
    c.pointerMove(160);
    expect(c.dragging).toBe(true);
    expect(c.velocity).toBeLessThan(0);
  });

  it('tells a click from a drag by the movement threshold', () => {
    const c = createCarousel({ count: 11, clickThreshold: 6 });
    c.pointerDown(100);
    c.pointerMove(103);
    expect(c.pointerUp(103)).toEqual({ click: true });
    c.pointerDown(100);
    c.pointerMove(130);
    expect(c.pointerUp(130)).toEqual({ click: false });
    expect(c.dragging).toBe(false);
  });

  it('ignores moves without a pointer down', () => {
    const c = createCarousel({ count: 11 });
    c.pointerMove(300);
    expect(c.velocity).toBe(0);
  });

  it('snaps to the nearest item once it slows down', () => {
    const c = createCarousel({ count: 11, spacing: 1 });
    c.addVelocity(0.1);
    settle(c);
    expect(c.offset).toBeCloseTo(Math.round(c.offset), 3);
    expect(c.velocity).toBe(0);
  });

  it('snapNearest rounds to the closest item', () => {
    const c = createCarousel({ count: 11, spacing: 1 });
    c.offset = 2.3;
    c.snapNearest();
    settle(c);
    expect(c.offset).toBeCloseTo(2, 3);
    expect(c.focusedIndex()).toBe(2);
  });

  it('focusIndex takes the shortest way around the loop', () => {
    const c = createCarousel({ count: 11, spacing: 1 });
    c.focusIndex(10);
    settle(c);
    expect(c.offset).toBeCloseTo(-1, 3);
    expect(c.focusedIndex()).toBe(10);
    expect(c.itemTransform(10).x).toBeCloseTo(0, 3);
  });

  it('keeps the focused item when the spacing changes', () => {
    const c = createCarousel({ count: 11, spacing: 1 });
    c.focusIndex(3);
    settle(c);
    c.setSpacing(2);
    expect(c.focusedIndex()).toBe(3);
    expect(c.itemTransform(3).x).toBeCloseTo(0, 3);
  });

  it('grabbing a moving carousel stops it', () => {
    const c = createCarousel({ count: 11 });
    c.addVelocity(0.3);
    c.pointerDown(0);
    expect(c.velocity).toBe(0);
  });
});

describe('layoutFor', () => {
  it('shows about 4-5 bubbles on a desktop screen', () => {
    const { spacing, radius } = layoutFor(16 / 9);
    const visibleWidth = 2 * 5 * Math.tan((45 / 2) * (Math.PI / 180)) * (16 / 9);
    const visible = visibleWidth / spacing;
    expect(visible).toBeGreaterThanOrEqual(4);
    expect(visible).toBeLessThanOrEqual(5);
    expect(radius * 2).toBeLessThan(spacing);
  });

  it('shows about 2-3 bubbles on a phone screen', () => {
    const { spacing, radius } = layoutFor(390 / 844);
    const visibleWidth = 2 * 5 * Math.tan((45 / 2) * (Math.PI / 180)) * (390 / 844);
    const visible = visibleWidth / spacing;
    expect(visible).toBeGreaterThanOrEqual(2);
    expect(visible).toBeLessThanOrEqual(3);
    expect(radius * 2).toBeLessThan(spacing);
  });
});
