import '@testing-library/jest-dom/vitest';

// Deterministic secret for signing tests (refund tokens, etc.).
process.env.REFUND_TOKEN_SECRET ||= 'test-refund-secret';

// jsdom lacks ResizeObserver, which Radix UI primitives (e.g. Checkbox) touch on
// mount. A no-op stub is enough for these tests.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver =
  globalThis.ResizeObserver ?? (ResizeObserverStub as unknown as typeof ResizeObserver);
