'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TextInput, useField } from '@payloadcms/ui';
import type { TextFieldClientComponent } from 'payload';

type Preview = {
  cover: string | null;
  title: string;
  author: string;
  description: string | null;
};

// Module-scope guard so that when the second of the two fields blurs, only one
// lookup fires for a given title+author pair (the two field instances don't
// share React state).
let lastLookedUpKey = '';

/**
 * Custom Field used on BOTH `bookTitle` and `bookAuthor`. When both are filled
 * and either loses focus, it looks the book up on Open Library, stores the work
 * id, and fills the (blank) name. The `bookAuthor` instance also renders a
 * cover/description preview. The save-time hook is the backstop, so correctness
 * never depends on the blur firing.
 */
export const BookLookupField: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue, showError } = useField<string>({ path });
  const titleField = useField<string>({ path: 'bookTitle' });
  const authorField = useField<string>({ path: 'bookAuthor' });
  const nameField = useField<string>({ path: 'name' });
  const olIdField = useField<string>({ path: 'openLibraryId' });

  const isAuthor = path === 'bookAuthor';
  const inputRef = useRef<HTMLInputElement>(null);

  // Latest sibling values, so the blur listener isn't a stale closure.
  const refs = useRef({ titleField, authorField, nameField, olIdField });
  refs.current = { titleField, authorField, nameField, olIdField };

  const [status, setStatus] = useState<
    'idle' | 'loading' | 'found' | 'notfound' | 'error'
  >('idle');
  const [preview, setPreview] = useState<Preview | null>(null);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const onBlur = async () => {
      const { titleField: t, authorField: a, nameField: n, olIdField: ol } =
        refs.current;
      const title = (t.value || '').trim();
      const author = (a.value || '').trim();
      if (!title || !author) return;

      const key = `${title}|||${author}`;
      if (key === lastLookedUpKey) return;
      lastLookedUpKey = key;

      if (isAuthor) setStatus('loading');
      try {
        const res = await fetch(
          `/api/openlibrary-lookup?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`
        );
        const data = await res.json();
        if (!res.ok || !data.found) {
          if (isAuthor) {
            setStatus('notfound');
            setPreview(null);
          }
          return;
        }
        if (data.openLibraryId) ol.setValue(data.openLibraryId);
        if (data.name && !n.value) n.setValue(data.name);
        if (isAuthor) {
          setPreview({
            cover: data.cover,
            title: data.title,
            author: data.author,
            description: data.description,
          });
          setStatus('found');
        }
      } catch {
        if (isAuthor) setStatus('error');
      }
    };

    el.addEventListener('blur', onBlur);
    return () => el.removeEventListener('blur', onBlur);
  }, [isAuthor]);

  return (
    <div>
      <TextInput
        path={path}
        label={field?.label}
        showError={showError}
        value={value || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setValue(e.target.value)
        }
        inputRef={inputRef as React.RefObject<HTMLInputElement>}
        description={field?.admin?.description}
      />

      {isAuthor && status === 'loading' && (
        <p style={{ margin: '0.25rem 0 0', opacity: 0.7 }}>Looking up book…</p>
      )}
      {isAuthor && status === 'notfound' && (
        <p style={{ margin: '0.25rem 0 0', color: 'var(--theme-error-500)' }}>
          No Open Library match for that title + author.
        </p>
      )}
      {isAuthor && status === 'error' && (
        <p style={{ margin: '0.25rem 0 0', color: 'var(--theme-error-500)' }}>
          Lookup failed — try again.
        </p>
      )}
      {isAuthor && status === 'found' && preview && (
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            marginTop: '0.5rem',
            padding: '0.5rem',
            border: '1px solid var(--theme-elevation-150)',
            borderRadius: 4,
          }}
        >
          {preview.cover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.cover}
              alt={`${preview.title} cover`}
              style={{ width: 56, height: 'auto', flexShrink: 0 }}
            />
          )}
          <div style={{ fontSize: 13 }}>
            <strong>
              {preview.title}
              {preview.author ? ` — ${preview.author}` : ''}
            </strong>
            {preview.description && (
              <p style={{ margin: '0.25rem 0 0', opacity: 0.8 }}>
                {preview.description.slice(0, 220)}
                {preview.description.length > 220 ? '…' : ''}
              </p>
            )}
            <p style={{ margin: '0.35rem 0 0', opacity: 0.6 }}>
              Filled the name. Description is set from this summary on save; the
              cover shows from Open Library automatically. All editable.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
