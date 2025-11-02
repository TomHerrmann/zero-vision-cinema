'use client';

import { ZVC_NAME, ZVC_EMAIL_ADDRESS } from '@/app/contsants/constants';
import { AddToCalendarButton } from 'add-to-calendar-button-react';

type AddToCalendarProps = {
  name: string;
  startDate: string;
  endDate?: string;
  startTime: string;
  endTime?: string;
  location?: string;
  description?: string;
  options?: ('Apple' | 'Google' | 'iCal' | 'Outlook.com' | 'Yahoo')[];
  timeZone?: string;
};

export default function AddToCalendar({
  name,
  startDate,
  endDate,
  startTime,
  endTime,
  location,
  description,
  options = ['Apple', 'Google', 'Outlook.com', 'iCal'],
  timeZone = 'America/New_York',
}: AddToCalendarProps) {
  return (
    <AddToCalendarButton
      name={name}
      startDate={startDate}
      endDate={endDate}
      startTime={startTime}
      endTime={endTime}
      location={location}
      description={description}
      options={options}
      timeZone={timeZone}
      organizer={`${ZVC_NAME}|${ZVC_EMAIL_ADDRESS}`}
      buttonStyle="text"
      forceOverlay={true}
      lightMode="bodyScheme"
      size="10"
      styleLight="--btn-background: rgb(12 74 110); --btn-text: rgb(254 252 232); --btn-background-hover: rgb(254 252 232); --btn-text-hover: rgb(12 74 110); --font: inherit;"
      styleDark="--btn-background: rgb(12 74 110); --btn-text: rgb(254 252 232); --btn-background-hover: rgb(254 252 232); --btn-text-hover: rgb(12 74 110); --font: inherit;"
      trigger="click"
    />
  );
}
