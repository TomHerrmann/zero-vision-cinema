import BroadcastEmail from '../BroadcastEmail';
import { broadcastAhcSample } from './sample-data';

// Local preview only (`npm run dev:email`). Free Astoria Horror Club movie
// event (→ "View Details & RSVP", "About the Film").
export default function BroadcastAhcPreview() {
  return <BroadcastEmail {...broadcastAhcSample} />;
}
