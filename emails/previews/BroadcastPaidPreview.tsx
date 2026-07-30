import BroadcastEmail from '../BroadcastEmail';
import { broadcastPaidSample } from './sample-data';

// Local preview only (`npm run dev:email`). Paid ZVC announcement variant
// (→ "Get Tickets", "About the Film").
export default function BroadcastPaidPreview() {
  return <BroadcastEmail {...broadcastPaidSample} />;
}
