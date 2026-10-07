'use client';

import React, { useEffect, useRef } from 'react';
import { FieldDescription, FieldLabel, useField } from '@payloadcms/ui';
import type { SelectFieldClientComponent } from 'payload';
import {
  defaultVenueField,
  nextDefaultDatetime,
  type EventType,
} from '@/utils/eventTypes';

type VenueDefaults = Partial<Record<string, number | null>>;

const idOf = (value: unknown): number | null => {
  if (value == null || value === '') return null;
  if (typeof value === 'object') return (value as { id?: number }).id ?? null;
  return Number(value);
};

const SUBTITLES: Record<string, string> = {
  zvc: 'Paid screening',
  ahc: 'Free movie night',
  bookclub: 'Free, picked by book',
  rww: 'Free Wednesday night',
  fri: 'Free Friday at Medusa',
  brew: 'Ticketed brewery night',
  bingo: 'Free bingo night',
  brunch: 'Free Saturday brunch',
};

/**
 * The event type as big choice cards instead of a dropdown. It writes
 * the same value the plain select did; only the control changes.
 *
 * Picking a type also swaps in that type's default venue (Settings → Default
 * venues) and next usual date and time, but each only while it is empty or
 * still the previous type's default, so nothing the admin set by hand is
 * overwritten.
 */
export const EventTypeField: SelectFieldClientComponent = ({ field, path, readOnly }) => {
  const { value, setValue, showError, disabled } = useField<string>({ path });
  const venue = useField<unknown>({ path: 'location' });
  const datetime = useField<string | null>({ path: 'datetime' });
  const locked = readOnly || disabled;

  const defaults = useRef<VenueDefaults | null>(null);
  useEffect(() => {
    fetch('/api/globals/settings?depth=0', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((settings) => {
        defaults.current = settings ?? {};
      })
      .catch(() => {
        // No defaults is fine: the admin just picks the venue by hand.
      });
  }, []);

  const pick = (next: string) => {
    if (next !== value) {
      const at = (iso?: string | null) => (iso ? new Date(iso).getTime() : null);
      const current = at(datetime.value);
      const previousDefault = value ? at(nextDefaultDatetime(value as EventType)) : null;
      if (current == null || current === previousDefault) {
        datetime.setValue(nextDefaultDatetime(next as EventType));
      }
    }

    const d = defaults.current;
    if (d && next !== value) {
      const previousDefault = value
        ? (idOf(d[defaultVenueField(value as EventType)]) ?? null)
        : null;
      const current = idOf(venue.value);
      const nextDefault = idOf(d[defaultVenueField(next as EventType)]);
      if (nextDefault != null && (current == null || current === previousDefault)) {
        venue.setValue(nextDefault);
      }
    }
    setValue(next);
  };

  return (
    <div className={`field-type zvc-type-field${showError ? ' error' : ''}`}>
      <FieldLabel label={field.label ?? 'Event type'} path={path} required={field.required} />
      <div className="zvc-type-field__options" role="radiogroup" aria-label="Event type">
        {field.options.map((option) => {
          const opt = typeof option === 'string' ? { label: option, value: option } : option;
          const selected = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={locked}
              className={`zvc-type-field__option${selected ? ' is-selected' : ''}`}
              onClick={() => pick(opt.value)}
            >
              <span className="zvc-type-field__label">
                {typeof opt.label === 'string' ? opt.label : opt.value}
              </span>
              {SUBTITLES[opt.value] && (
                <span className="zvc-type-field__sub">{SUBTITLES[opt.value]}</span>
              )}
            </button>
          );
        })}
      </div>
      <FieldDescription description={field.admin?.description} path={path} />
    </div>
  );
};
