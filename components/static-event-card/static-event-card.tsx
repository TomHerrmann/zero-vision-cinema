'use client';

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Calendar, MapPin, Clock } from 'lucide-react';
import Image from 'next/image';
import AddToCalendar from '../add-to-calendar/add-to-calendar';

type StaticEvent = {
  date: string;
  location: string;
  eventName?: string;
  time?: string;
  description?: string;
  image?: string;
};

type Props = {
  event: StaticEvent;
};

const StaticEventCard = ({ event }: Props) => {
  // Parse the date string (e.g., "Saturday Oct 25")
  const parseDateString = (dateStr: string) => {
    // Extract month and day from string like "Saturday Oct 25"
    const parts = dateStr.split(' ');
    const monthStr = parts[1];
    const day = parseInt(parts[2]);
    const year = 2025; // Hardcoded for Halloweek 2025

    const monthMap: { [key: string]: number } = {
      Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
      Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11
    };

    const month = monthMap[monthStr];
    return new Date(year, month, day);
  };

  // Parse time string (e.g., "8pm - 3am" or "7:30pm")
  const parseTimeString = (timeStr: string) => {
    const timePart = timeStr.split(' ')[0]; // Get first part before any dash
    const isPM = timePart.toLowerCase().includes('pm');
    const timeOnly = timePart.replace(/[apm]/gi, '');

    let [hours, minutes = '0'] = timeOnly.split(':');
    let hour = parseInt(hours);

    if (isPM && hour !== 12) {
      hour += 12;
    } else if (!isPM && hour === 12) {
      hour = 0;
    }

    return { hours: hour, minutes: parseInt(minutes) };
  };

  const formatDateForCalendar = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTimeForCalendar = (hours: number, minutes: number) => {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const eventDate = parseDateString(event.date);
  const startTime = event.time ? parseTimeString(event.time) : { hours: 19, minutes: 0 }; // Default 7pm

  // Set end time to 2 hours after start
  const endHours = (startTime.hours + 2) % 24;

  return (
    <Card className="flex flex-col h-full rounded-2xl shadow-md hover:shadow-lg transition bg-sky-900 overflow-hidden">
      <CardHeader className="pb-1 pt-4">
        {event.eventName && (
          <CardTitle className="text-center text-2xl font-bold line-clamp-2 min-h-[4rem]">
            {event.eventName}
          </CardTitle>
        )}
      </CardHeader>
      {event.image && (
        <div className="relative w-full aspect-[4/5] pb-2">
          <div className="relative w-full h-full overflow-hidden">
            <Image
              src={event.image}
              alt={event.eventName || 'Event image'}
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          </div>
        </div>
      )}
      <CardContent className="flex flex-col gap-3 flex-1">
        {event.description && (
          <p className="text-base leading-relaxed line-clamp-3">
            {event.description}
          </p>
        )}
        <div className="flex flex-col gap-2 text-md mt-auto">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <span className="line-clamp-2">{event.location}</span>
          </div>
          {event.time && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{event.time}</span>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="pb-4">
        <AddToCalendar
          name={event.eventName || 'Event'}
          startDate={formatDateForCalendar(eventDate)}
          startTime={formatTimeForCalendar(startTime.hours, startTime.minutes)}
          endDate={formatDateForCalendar(eventDate)}
          endTime={formatTimeForCalendar(endHours, startTime.minutes)}
          location={event.location}
          description={event.description}
        />
      </CardFooter>
    </Card>
  );
};

export default StaticEventCard;
