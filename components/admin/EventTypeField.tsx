'use client';

import React from 'react';
import { FieldDescription, FieldLabel, useField } from '@payloadcms/ui';
import type { SelectFieldClientComponent } from 'payload';

const SUBTITLES: Record<string, string> = {
  zvc: 'Paid screening',
  ahc: 'Free movie night',
  bookclub: 'Free, picked by book',
  rww: 'Free Wednesday night',
  fri: 'Free Friday at Medusa',
  brew: 'Free brewery night',
  bingo: 'Free bingo night',
};

/**
 * The event type as big choice cards instead of a dropdown. It writes
 * the same value the plain select did; only the control changes.
 */
export const EventTypeField: SelectFieldClientComponent = ({ field, path, readOnly }) => {
  const { value, setValue, showError, disabled } = useField<string>({ path });
  const locked = readOnly || disabled;

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
              onClick={() => setValue(opt.value)}
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
