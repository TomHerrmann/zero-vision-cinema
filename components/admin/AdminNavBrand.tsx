import React from 'react';
import type { ServerProps } from 'payload';

/**
 * Top of the admin sidebar: the ZVC mark and wordmark (both link home to the
 * dashboard), then a Dashboard link, which Payload's nav doesn't have.
 */
export function AdminNavBrand({ payload }: ServerProps) {
  const home = payload?.config.routes.admin ?? '/admin';
  return (
    <div className="zvc-nav-brand">
      <a className="zvc-nav-brand__mark" href={home}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logos/zvc_logo_logomark_rgb_color.svg" alt="" width={40} height={40} />
        <span>
          Zero Vision
          <br />
          Cinema
        </span>
      </a>
      <a className="nav__link zvc-nav-brand__home" href={home}>
        <span className="nav__link-label">Dashboard</span>
      </a>
    </div>
  );
}
