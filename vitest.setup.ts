import '@testing-library/jest-dom/vitest';

// jsdom lacks ResizeObserver, which Radix UI primitives (e.g. Checkbox) touch on
// mount. A no-op stub is enough for these tests.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver =
  globalThis.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver);
