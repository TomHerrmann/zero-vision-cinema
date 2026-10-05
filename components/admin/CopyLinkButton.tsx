'use client';

import React, { useState } from 'react';

/** Copies a value (a ticket link) to the clipboard, with a short confirmation. */
export function CopyLinkButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      className="btn btn--style-secondary btn--size-medium zvc-btn"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt('Copy this link', value);
        }
      }}
    >
      {copied ? 'Copied' : label}
    </button>
  );
}
