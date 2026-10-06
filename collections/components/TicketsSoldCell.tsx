'use client';

import React from 'react';
import type { DefaultCellComponentProps, NumberFieldClient } from 'payload';

/**
 * List-view cell for `ticketsSold`. Only ZVC events sell tickets — AHC and Book
 * Club events are always free — so those read "N/A" instead of a meaningless 0.
 */
export const TicketsSoldCell = ({
  cellData,
  rowData,
}: DefaultCellComponentProps<NumberFieldClient, number | null>) => {
  const eventType = rowData?.eventType as string | undefined;
  if (eventType && eventType !== 'zvc') return <span>N/A</span>;
  return <span>{cellData ?? 0}</span>;
};
