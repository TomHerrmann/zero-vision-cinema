'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TextInput, useField } from '@payloadcms/ui';
import type { TextFieldClientComponent } from 'payload';

type Preview = {
  poster: string | null;
  title: string;
  year: string;
  plot: string | null;
};

const properImbdIdLenght = (id: string) => id.length === 9 || id.length === 10;

/**
 * Custom Field for the IMDb ID. On blur it looks the movie up via
 * /api/omdb-lookup and auto-fills the (still editable) name when it's blank,
 * and shows a small confirmation preview. Description is filled server-side on
 * save (a richText editor ignores programmatic values); the poster is not
 * stored — pages fall back to the OMDB poster URL at render time.
 */
export const ImdbLookupField: TextFieldClientComponent = ({ field, path }) => {
  const { value, setValue, showError } = useField<string>({ path });
  const nameField = useField<string>({ path: 'name' });

  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value);
  valueRef.current = value;
  const lastLookedUp = useRef('');

  const [status, setStatus] = useState<
    'idle' | 'loading' | 'found' | 'notfound' | 'error'
  >('idle');
  const [preview, setPreview] = useState<Preview | null>(null);

  // Keep field setters in a ref so the blur listener always sees the latest.
  const fillRef = useRef({ nameField });
  fillRef.current = { nameField };

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;

    const onBlur = async () => {
      const id = (valueRef.current || '').trim();
      if (
        !id ||
        id === lastLookedUp.current ||
        !/^tt\d+$/.test(id) ||
        !properImbdIdLenght(id)
      )
        return;
      lastLookedUp.current = id;
      setStatus('loading');
      try {
        const res = await fetch(
          `/api/omdb-lookup?imdbId=${encodeURIComponent(id)}`
        );
        const data = await res.json();
        if (!res.ok || !data.found) {
          setStatus('notfound');
          setPreview(null);
          return;
        }
        const { nameField: n } = fillRef.current;
        if (data.name && !n.value) n.setValue(data.name);
        setPreview({
          poster: data.poster,
          title: data.title,
          year: data.year,
          plot: data.plot,
        });
        setStatus('found');
      } catch {
        setStatus('error');
      }
    };

    el.addEventListener('blur', onBlur);
    return () => el.removeEventListener('blur', onBlur);
  }, []);

  return (
    <div>
      <TextInput
        path={path}
        label={field?.label}
        required={field?.required}
        showError={showError}
        value={value || ''}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setValue(e.target.value)
        }
        inputRef={inputRef as React.RefObject<HTMLInputElement>}
        placeholder="tt0088247"
        description={field?.admin?.description}
      />

      {status === 'loading' && (
        <p style={{ margin: '0.25rem 0 0', opacity: 0.7 }}>Looking up movie…</p>
      )}
      {status === 'notfound' && (
        <p style={{ margin: '0.25rem 0 0', color: 'var(--theme-error-500)' }}>
          No IMDb match found for that ID.
        </p>
      )}
      {status === 'error' && (
        <p style={{ margin: '0.25rem 0 0', color: 'var(--theme-error-500)' }}>
          Lookup failed — try again.
        </p>
      )}
      {status === 'found' && preview && (
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
          {preview.poster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview.poster}
              alt={`${preview.title} poster`}
              style={{ width: 56, height: 'auto', flexShrink: 0 }}
            />
          )}
          <div style={{ fontSize: 13 }}>
            <strong>
              {preview.title}
              {preview.year ? ` (${preview.year})` : ''}
            </strong>
            {preview.plot && (
              <p style={{ margin: '0.25rem 0 0', opacity: 0.8 }}>
                {preview.plot}
              </p>
            )}
            <p style={{ margin: '0.35rem 0 0', opacity: 0.6 }}>
              Filled the name. Description is set from this plot on save; the
              poster shows from OMDB automatically. All still editable.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
