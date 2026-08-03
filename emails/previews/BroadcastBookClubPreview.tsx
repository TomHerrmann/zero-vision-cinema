import BroadcastEmail from '../BroadcastEmail';
import { broadcastBookClubSample } from './sample-data';

// Local preview only (`npm run dev:email`). Free book-club reminder variant
// (→ "View Details & RSVP", "About the Book").
export default function BroadcastBookClubPreview() {
  return <BroadcastEmail {...broadcastBookClubSample} />;
}
