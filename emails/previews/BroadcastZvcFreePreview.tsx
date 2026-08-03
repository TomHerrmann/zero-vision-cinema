import BroadcastEmail from '../BroadcastEmail';
import { broadcastZvcFreeSample } from './sample-data';

// Local preview only (`npm run dev:email`). Free ZVC screening ($0) — no CTA,
// "About the Film".
export default function BroadcastZvcFreePreview() {
  return <BroadcastEmail {...broadcastZvcFreeSample} />;
}
