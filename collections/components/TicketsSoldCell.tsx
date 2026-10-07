'use client';

import React from 'react';
import type { DefaultCellComponentProps, NumberFieldClient } from 'payload';
import { isPaidEventType } from '@/utils/eventTypes';

/**
 * List-view cell for `ticketsSold`. Only ZVC and Brewscares sell tickets — every
 * other type is always free — so those read "N/A" instead of a meaningless 0.
 */
export const TicketsSoldCell = ({
  cellData,
  rowData,
}: DefaultCellComponentProps<NumberFieldClient, number | null>) => {
  const eventType = rowData?.eventType as string | undefined;
  if (eventType && !isPaidEventType(eventType)) return <span>N/A</span>;
  return <span>{cellData ?? 0}</span>;
};
