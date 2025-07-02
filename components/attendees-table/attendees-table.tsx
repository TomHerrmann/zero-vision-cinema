'use client';

import { Checkbox } from '../ui/checkbox';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { useState } from 'react';

type Props = {
  attendees: Attendee[];
  eventName: string;
};

export const AttendeesTable = ({ attendees, eventName }: Props) => {
  const [checkIns, setCheckIns] = useState(new Set<number>());
  return (
    <main className="flex flex-col m-5 mb-12 md:py-12 md:px-24 md:my-12 md:mx-24 gap-12">
      <>
        <div className="flex flex-col gap-8">
          <h1 className="text-4xl font-semibold">Attendees</h1>
          <h2 className="text-2xl font-semibold">{eventName}</h2>
        </div>
        <Table>
          <TableCaption>{`${eventName} Attendees`}</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Checked</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Orders</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendees.map(({ customerName, customerEmail, createdAt }, i) => (
              <TableRow key={`${customerEmail}_${i}_attendee`}>
                <TableCell className="flex justify-center">
                  <Checkbox
                    checked={checkIns.has(i)}
                    onCheckedChange={() => {
                      const newCheckIns = new Set([...checkIns]);
                      newCheckIns.has(i)
                        ? newCheckIns.delete(i)
                        : newCheckIns.add(i);
                      setCheckIns(newCheckIns);
                    }}
                  />
                </TableCell>
                <TableCell
                  className={`font-bold ${checkIns.has(i) ? 'line-through' : ''}`}
                >
                  {customerName}
                </TableCell>
                <TableCell
                  className={`${checkIns.has(i) ? 'line-through' : ''}`}
                >
                  {customerEmail}
                </TableCell>
                <TableCell
                  className={`${checkIns.has(i) ? 'line-through' : ''}`}
                >
                  {new Date(createdAt).toLocaleString('en-US', {
                    dateStyle: 'long',
                    timeStyle: 'short',
                    timeZone: 'America/New_York',
                  })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3}>Total</TableCell>
              <TableCell className="text-right">{attendees.length}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </>
    </main>
  );
};
