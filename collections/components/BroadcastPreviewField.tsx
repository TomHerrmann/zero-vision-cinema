'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useField } from '@payloadcms/ui';
import type { UIFieldClientComponent } from 'payload';

/**
 * Sidebar widget for the Custom Broadcasts collection: renders the draft's
 * current field values through the real send template and shows the result in
 * a modal. Pure preview — nothing is sent and nothing is saved.
 *
 * The dialog is portaled to document.body with a z-index above the admin's
 * highest layers: the Lexical editor's floating toolbar renders at
 * --z-popup (60), above Payload's own modal layer, so a plain in-tree overlay
 * would have the command bar paint over it.
 */
export const BroadcastPreviewField: UIFieldClientComponent = () => {
  const { value: subject } = useField<string>({ path: 'subject' });
  const { value: heading } = useField<string>({ path: 'heading' });
  const { value: images } = useField<unknown>({ path: 'images' });
  const { value: body } = useField<unknown>({ path: 'body' });
  const { value: ctaEnabled } = useField<boolean>({ path: 'cta.enabled' });
  const { value: ctaLabel } = useField<string>({ path: 'cta.label' });
  const { value: ctaUrl } = useField<string>({ path: 'cta.url' });

  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [html, setHtml] = useState<string | null>(null);
  // Portals need document, which doesn't exist during server render.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Upload field values arrive as ids or populated docs, like the send path.
  const toIds = (value: unknown): (number | string)[] => {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) =>
        item && typeof item === 'object'
          ? (item as { id?: unknown }).id
          : item,
      )
      .filter((id): id is number | string => id != null);
  };

  const preview = async () => {
    setStatus('loading');
    setHtml(null);
    setOpen(true);
    try {
      const res = await fetch('/api/custom-broadcast-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: subject ?? '',
          heading: heading ?? null,
          imageIds: toIds(images),
          body: body ?? null,
          cta:
            ctaEnabled && ctaLabel && ctaUrl
              ? { label: ctaLabel, url: ctaUrl }
              : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? 'Preview failed.');
      setHtml(data.html);
      setStatus('idle');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div>
      <button
        type="button"
        className="btn btn--style-secondary btn--size-medium"
        onClick={preview}
      >
        Preview email
      </button>
      <p style={{ margin: '0.5rem 0 0', opacity: 0.65, fontSize: 13 }}>
        Renders this draft exactly as it would send. Nothing is sent.
      </p>

      {mounted &&
        open &&
        createPortal(
          <div
            style={overlay}
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Email preview"
          >
            <div style={panel} onClick={(e) => e.stopPropagation()}>
              <div style={header}>
                <div>
                  <strong>Email preview</strong>
                  <div style={{ opacity: 0.65, fontSize: 13 }}>
                    {subject?.trim() ? subject : 'Untitled draft'} — draft
                    only, nothing was sent.
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn--style-secondary btn--size-small"
                  onClick={() => setOpen(false)}
                >
                  Close
                </button>
              </div>

              {status === 'loading' && (
                <p style={{ padding: 24, opacity: 0.7 }}>Rendering…</p>
              )}
              {status === 'error' && (
                <p style={{ padding: 24, color: 'var(--theme-error-500)' }}>
                  Couldn&apos;t render the preview — try again.
                </p>
              )}
              {status === 'idle' && html && (
                <iframe
                  title="Broadcast preview"
                  srcDoc={html}
                  sandbox=""
                  style={{ width: '100%', height: '70vh', border: 0 }}
                />
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
};

const overlay: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  // Above every admin layer: the editor's floating toolbar sits at --z-popup
  // (60), higher than Payload's own modal layer (--z-modal: 30).
  zIndex: 10000,
  background: 'rgba(0, 0, 0, 0.7)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
};

const panel: React.CSSProperties = {
  width: 'min(720px, 100%)',
  maxHeight: '90vh',
  overflow: 'auto',
  background: 'var(--theme-elevation-50)',
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 6,
};

const header: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: 16,
  padding: '16px 20px',
  borderBottom: '1px solid var(--theme-elevation-150)',
};
